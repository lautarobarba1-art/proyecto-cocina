import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  notifyPaymentConfirmed,
  notifyReservationConfirmed,
  notifyClassRescheduled,
  notifyReservationCancelled,
  notifyAdminNewReservation,
  notifyAdminNewInquiry,
} from "./notify.ts";

function createMockSupabase() {
  const claimedKeys = new Set<string>();
  const claimCalls: Array<Record<string, unknown>> = [];
  const completeCalls: Array<Record<string, unknown>> = [];
  let id = 0;

  const client = {
    async rpc(name: string, args: Record<string, unknown>) {
      if (name === "claim_notification_attempt") {
        claimCalls.push(args);
        const key = `${args.p_channel}:${args.p_delivery_mode}:${args.p_deduplication_key}`;
        if (claimedKeys.has(key)) {
          return { data: [{ id: `row-${id}`, claim_token: null, attempt_count: 1, claimed: false }], error: null };
        }
        claimedKeys.add(key);
        id += 1;
        return { data: [{ id: `row-${id}`, claim_token: `token-${id}`, attempt_count: 1, claimed: true }], error: null };
      }
      if (name === "complete_notification_attempt") {
        completeCalls.push(args);
        return { data: true, error: null };
      }
      throw new Error(`RPC no mockeada: ${name}`);
    },
  };

  return {
    client: client as unknown as SupabaseClient,
    claimCalls,
    completeCalls,
  };
}

const reservationParams = {
  reservationId: "res-1",
  classId: "class-1",
  customerName: "Ana",
  customerEmail: "ana@example.com",
  className: "Cocina italiana",
  classDateISO: "2026-08-01",
  classStartTime: "10:00:00",
  classEndTime: "12:00:00",
  spots: 2,
  depositAmount: 5000,
  transferHolder: "Menesteres",
  transferAlias: "alias",
  transferCvu: "cvu",
  transferBank: "Banco",
};

test("la confirmación de reserva envía email y registra el intento", async () => {
  const { client, claimCalls, completeCalls } = createMockSupabase();
  const sent: unknown[] = [];

  const result = await notifyReservationConfirmed(client, reservationParams, {
    sendEmailReservaConfirmacion: async (data) => {
      sent.push(data);
      return { success: true };
    },
  });

  assert.equal(result.email.outcome, "sent");
  assert.equal(sent.length, 1);
  assert.equal(claimCalls[0].p_channel, "email");
  assert.equal(completeCalls[0].p_status, "sent");
});

test("una reserva repetida no genera un segundo email", async () => {
  const { client } = createMockSupabase();
  let sends = 0;
  const deps = {
    sendEmailReservaConfirmacion: async () => {
      sends += 1;
      return { success: true };
    },
  };

  const first = await notifyReservationConfirmed(client, reservationParams, deps);
  const second = await notifyReservationConfirmed(client, reservationParams, deps);

  assert.equal(first.email.outcome, "sent");
  assert.equal(second.email.outcome, "not_claimed");
  assert.equal(sends, 1);
});

test("un error de Resend queda como fallido y reintentable", async () => {
  const { client, completeCalls } = createMockSupabase();
  const result = await notifyReservationConfirmed(client, reservationParams, {
    sendEmailReservaConfirmacion: async () => ({ success: false, error: "resend caído" }),
  });

  assert.equal(result.email.outcome, "failed");
  assert.equal(completeCalls[0].p_status, "failed");
  assert.equal(completeCalls[0].p_retryable, true);
});

test("la confirmación de pago también se deduplica por email", async () => {
  const { client } = createMockSupabase();
  let sends = 0;
  const params = {
    reservationId: "res-1",
    classId: "class-1",
    customerName: "Ana",
    customerEmail: "ana@example.com",
    className: "Cocina italiana",
    classDateISO: "2026-08-01",
    classStartTime: "10:00:00",
    classEndTime: "12:00:00",
    spots: 2,
  };
  const deps = {
    sendEmailReservaConfirmada: async () => {
      sends += 1;
      return { success: true };
    },
  };

  const first = await notifyPaymentConfirmed(client, params, deps);
  const second = await notifyPaymentConfirmed(client, params, deps);

  assert.equal(first.email.outcome, "sent");
  assert.equal(second.email.outcome, "not_claimed");
  assert.equal(sends, 1);
});

const rescheduleParams = {
  reservationId: "res-1",
  classId: "class-1",
  customerName: "Ana",
  customerEmail: "ana@example.com",
  className: "Cocina italiana",
  oldDateISO: "2026-08-01",
  oldStartTime: "10:00:00",
  oldEndTime: "12:00:00",
  newDateISO: "2026-08-05",
  newStartTime: "10:00:00",
  newEndTime: "12:00:00",
};

test("la reprogramación envía email y registra el intento", async () => {
  const { client, claimCalls, completeCalls } = createMockSupabase();
  const sent: unknown[] = [];

  const result = await notifyClassRescheduled(client, rescheduleParams, {
    sendEmailReprogramacion: async (data) => {
      sent.push(data);
      return { success: true };
    },
  });

  assert.equal(result.email.outcome, "sent");
  assert.equal(sent.length, 1);
  assert.equal(claimCalls[0].p_event_type, "reprogramacion");
  assert.equal(completeCalls[0].p_status, "sent");
});

test("la reprogramación guarda fecha+horario viejo/nuevo en el payload (para el worker de reintentos)", async () => {
  const { client, claimCalls } = createMockSupabase();

  await notifyClassRescheduled(client, rescheduleParams, {
    sendEmailReprogramacion: async () => ({ success: true }),
  });

  const payload = claimCalls[0].p_payload as Record<string, unknown>;
  assert.equal(payload.oldDate, "2026-08-01");
  assert.equal(payload.oldStartTime, "10:00:00");
  assert.equal(payload.oldEndTime, "12:00:00");
  assert.equal(payload.newDate, "2026-08-05");
  assert.equal(payload.newStartTime, "10:00:00");
  assert.equal(payload.newEndTime, "12:00:00");
});

test("la misma reprogramación reenviada no genera un segundo email", async () => {
  const { client } = createMockSupabase();
  let sends = 0;
  const deps = {
    sendEmailReprogramacion: async () => {
      sends += 1;
      return { success: true };
    },
  };

  const first = await notifyClassRescheduled(client, rescheduleParams, deps);
  const second = await notifyClassRescheduled(client, rescheduleParams, deps);

  assert.equal(first.email.outcome, "sent");
  assert.equal(second.email.outcome, "not_claimed");
  assert.equal(sends, 1);
});

test("una segunda reprogramación distinta (nueva transición) sí genera un nuevo email", async () => {
  const { client } = createMockSupabase();
  let sends = 0;
  const deps = {
    sendEmailReprogramacion: async () => {
      sends += 1;
      return { success: true };
    },
  };

  const primera = await notifyClassRescheduled(client, rescheduleParams, deps);
  const segunda = await notifyClassRescheduled(client, {
    ...rescheduleParams,
    oldDateISO: rescheduleParams.newDateISO,
    newDateISO: "2026-08-10",
  }, deps);

  assert.equal(primera.email.outcome, "sent");
  assert.equal(segunda.email.outcome, "sent");
  assert.equal(sends, 2);
});

const adminReservationParams = {
  reservationId: "res-1",
  classId: "class-1",
  customerName: "Ana",
  customerEmail: "ana@example.com",
  customerPhone: "+54 9 3492 000000",
  className: "Cocina italiana",
  classDateISO: "2026-08-01",
  spots: 2,
  reviewUrl: "https://menesteres.ar/admin/reservas?estado=pending",
};

test("aviso a la admin de reserva nueva: envía email y registra el intento", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = "admin@example.com";
  t.after(() => {
    process.env.ADMIN_EMAIL = original;
  });

  const { client, claimCalls, completeCalls } = createMockSupabase();
  const sent: unknown[] = [];

  const result = await notifyAdminNewReservation(client, adminReservationParams, {
    sendEmailAdminReservaNueva: async (data) => {
      sent.push(data);
      return { success: true };
    },
  });

  assert.equal(result.email.outcome, "sent");
  assert.equal(sent.length, 1);
  assert.equal(claimCalls[0].p_event_type, "reserva_nueva_admin");
  assert.equal(claimCalls[0].p_recipient, "admin@example.com");
  assert.equal(completeCalls[0].p_status, "sent");
});

test("ADMIN_EMAIL con dos direcciones: el recipient del log queda con ambas", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = "duena@example.com,socia@example.com";
  t.after(() => {
    process.env.ADMIN_EMAIL = original;
  });

  const { client, claimCalls } = createMockSupabase();

  const result = await notifyAdminNewReservation(client, adminReservationParams, {
    sendEmailAdminReservaNueva: async () => ({ success: true }),
  });

  assert.equal(result.email.outcome, "sent");
  assert.equal(claimCalls[0].p_recipient, "duena@example.com, socia@example.com");
});

test("ADMIN_EMAIL con espacios de más alrededor de la coma se limpia bien", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = "  duena@example.com ,  socia@example.com  ";
  t.after(() => {
    process.env.ADMIN_EMAIL = original;
  });

  const { client, claimCalls } = createMockSupabase();

  await notifyAdminNewReservation(client, adminReservationParams, {
    sendEmailAdminReservaNueva: async () => ({ success: true }),
  });

  assert.equal(claimCalls[0].p_recipient, "duena@example.com, socia@example.com");
});

test("ADMIN_EMAIL vacío tras limpiar comas sueltas (',,') se trata como no configurado", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = " , , ";
  t.after(() => {
    process.env.ADMIN_EMAIL = original;
  });

  const { client, claimCalls } = createMockSupabase();
  let sends = 0;

  const result = await notifyAdminNewReservation(client, adminReservationParams, {
    sendEmailAdminReservaNueva: async () => {
      sends += 1;
      return { success: true };
    },
  });

  assert.equal(result.email.outcome, "not_claimed");
  assert.equal(sends, 0);
  assert.equal(claimCalls.length, 0);
});

test("aviso a la admin de reserva nueva: sin ADMIN_EMAIL no reclama ni envía nada", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_EMAIL;
  t.after(() => {
    process.env.ADMIN_EMAIL = original;
  });

  const { client, claimCalls } = createMockSupabase();
  let sends = 0;

  const result = await notifyAdminNewReservation(client, adminReservationParams, {
    sendEmailAdminReservaNueva: async () => {
      sends += 1;
      return { success: true };
    },
  });

  assert.equal(result.email.outcome, "not_claimed");
  assert.equal(sends, 0);
  assert.equal(claimCalls.length, 0);
});

test("aviso a la admin de reserva nueva: la misma reserva no genera un segundo email", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = "admin@example.com";
  t.after(() => {
    process.env.ADMIN_EMAIL = original;
  });

  const { client } = createMockSupabase();
  let sends = 0;
  const deps = {
    sendEmailAdminReservaNueva: async () => {
      sends += 1;
      return { success: true };
    },
  };

  const first = await notifyAdminNewReservation(client, adminReservationParams, deps);
  const second = await notifyAdminNewReservation(client, adminReservationParams, deps);

  assert.equal(first.email.outcome, "sent");
  assert.equal(second.email.outcome, "not_claimed");
  assert.equal(sends, 1);
});

const adminInquiryParams = {
  inquiryId: "inq-1",
  customerName: "Bea",
  customerEmail: "bea@example.com",
  typeLabel: "Alquiler del espacio",
  message: "Quisiera alquilar el salón para un cumpleaños.",
  reviewUrl: "https://menesteres.ar/admin/inquiries",
};

test("aviso a la admin de consulta nueva: envía email y registra el intento", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = "admin@example.com";
  t.after(() => {
    process.env.ADMIN_EMAIL = original;
  });

  const { client, claimCalls, completeCalls } = createMockSupabase();
  const sent: unknown[] = [];

  const result = await notifyAdminNewInquiry(client, adminInquiryParams, {
    sendEmailAdminConsultaNueva: async (data) => {
      sent.push(data);
      return { success: true };
    },
  });

  assert.equal(result.email.outcome, "sent");
  assert.equal(sent.length, 1);
  assert.equal(claimCalls[0].p_event_type, "consulta_nueva_admin");
  assert.equal(claimCalls[0].p_reservation_id, null);
  assert.equal(claimCalls[0].p_class_id, null);
  assert.equal(completeCalls[0].p_status, "sent");
});

test("aviso a la admin de consulta nueva: sin ADMIN_EMAIL no reclama ni envía nada", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_EMAIL;
  t.after(() => {
    process.env.ADMIN_EMAIL = original;
  });

  const { client, claimCalls } = createMockSupabase();
  let sends = 0;

  const result = await notifyAdminNewInquiry(client, adminInquiryParams, {
    sendEmailAdminConsultaNueva: async () => {
      sends += 1;
      return { success: true };
    },
  });

  assert.equal(result.email.outcome, "not_claimed");
  assert.equal(sends, 0);
  assert.equal(claimCalls.length, 0);
});

test("aviso a la admin de consulta nueva: la misma consulta no genera un segundo email", async (t) => {
  const original = process.env.ADMIN_EMAIL;
  process.env.ADMIN_EMAIL = "admin@example.com";
  t.after(() => {
    process.env.ADMIN_EMAIL = original;
  });

  const { client } = createMockSupabase();
  let sends = 0;
  const deps = {
    sendEmailAdminConsultaNueva: async () => {
      sends += 1;
      return { success: true };
    },
  };

  const first = await notifyAdminNewInquiry(client, adminInquiryParams, deps);
  const second = await notifyAdminNewInquiry(client, adminInquiryParams, deps);

  assert.equal(first.email.outcome, "sent");
  assert.equal(second.email.outcome, "not_claimed");
  assert.equal(sends, 1);
});

const cancelParams = {
  reservationId: "res-1",
  classId: "class-1",
  customerName: "Ana",
  customerEmail: "ana@example.com",
  className: "Cocina italiana",
};

test("la cancelación manual envía email y lo registra como evento 'cancelacion'", async () => {
  const { client, claimCalls, completeCalls } = createMockSupabase();
  const sent: Array<[string, string, string]> = [];

  const result = await notifyReservationCancelled(client, cancelParams, {
    sendEmailReservaCancelada: async (email, name, className) => {
      sent.push([email, name, className]);
      return { success: true };
    },
  });

  assert.equal(result.email.outcome, "sent");
  assert.deepEqual(sent[0], ["ana@example.com", "Ana", "Cocina italiana"]);
  assert.equal(claimCalls[0].p_event_type, "cancelacion");
  assert.equal(claimCalls[0].p_template_name, "reserva_cancelada");
  assert.equal(completeCalls[0].p_status, "sent");
});

test("cancelar dos veces la misma reserva no genera un segundo email", async () => {
  const { client } = createMockSupabase();
  let sends = 0;
  const deps = {
    sendEmailReservaCancelada: async () => {
      sends += 1;
      return { success: true as const };
    },
  };

  const first = await notifyReservationCancelled(client, cancelParams, deps);
  const second = await notifyReservationCancelled(client, cancelParams, deps);

  assert.equal(first.email.outcome, "sent");
  assert.equal(second.email.outcome, "not_claimed");
  assert.equal(sends, 1);
});

test("si Resend falla, la cancelación queda failed/retryable con next_retry_at (backoff)", async () => {
  const { client, completeCalls } = createMockSupabase();

  const result = await notifyReservationCancelled(client, cancelParams, {
    sendEmailReservaCancelada: async () => ({ success: false, error: "resend caído" }),
  });

  assert.equal(result.email.outcome, "failed");
  assert.equal(completeCalls[0].p_status, "failed");
  assert.equal(completeCalls[0].p_retryable, true);
  assert.ok(
    typeof completeCalls[0].p_next_retry_at === "string",
    "debe fijar next_retry_at para el backoff del worker de reintentos",
  );
});
