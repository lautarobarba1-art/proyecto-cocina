import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildReservaConfirmadaComponents,
  buildPagoConfirmadoComponents,
} from "./templates.ts";

test("buildReservaConfirmadaComponents arma un body con 5 parámetros en el orden esperado", () => {
  const components = buildReservaConfirmadaComponents({
    customerName: "Ana",
    className: "Cocina italiana",
    classDate: "1 de agosto de 2026",
    classTime: "10:00 - 12:00",
    spots: 2,
  });

  assert.equal(components.length, 1);
  assert.equal(components[0].type, "body");
  assert.deepEqual(
    components[0].parameters.map((p) => p.text),
    ["Ana", "Cocina italiana", "1 de agosto de 2026", "10:00 - 12:00", "2"],
  );
});

test("buildReservaConfirmadaComponents rechaza campos obligatorios vacíos", () => {
  assert.throws(
    () =>
      buildReservaConfirmadaComponents({
        customerName: "",
        className: "Cocina italiana",
        classDate: "1 de agosto de 2026",
        classTime: "10:00 - 12:00",
        spots: 1,
      }),
    /customerName/,
  );
});

test("buildReservaConfirmadaComponents rechaza spots no enteros o menores a 1", () => {
  assert.throws(() =>
    buildReservaConfirmadaComponents({
      customerName: "Ana",
      className: "X",
      classDate: "1 de agosto de 2026",
      classTime: "10:00 - 12:00",
      spots: 0,
    }),
  );
  assert.throws(() =>
    buildReservaConfirmadaComponents({
      customerName: "Ana",
      className: "X",
      classDate: "1 de agosto de 2026",
      classTime: "10:00 - 12:00",
      spots: 1.5,
    }),
  );
});

test("buildReservaConfirmadaComponents trunca valores excesivamente largos (largo razonable)", () => {
  const tooLong = "x".repeat(1000);
  const components = buildReservaConfirmadaComponents({
    customerName: tooLong,
    className: "X",
    classDate: "1 de agosto de 2026",
    classTime: "10:00 - 12:00",
    spots: 1,
  });
  assert.ok(components[0].parameters[0].text.length <= 300);
});

test("buildPagoConfirmadoComponents arma un body con 4 parámetros en el orden esperado", () => {
  const components = buildPagoConfirmadoComponents({
    customerName: "Ana",
    className: "Cocina italiana",
    classDate: "1 de agosto de 2026",
    classTime: "10:00 - 12:00",
  });

  assert.deepEqual(
    components[0].parameters.map((p) => p.text),
    ["Ana", "Cocina italiana", "1 de agosto de 2026", "10:00 - 12:00"],
  );
});

test("buildPagoConfirmadoComponents rechaza campos obligatorios faltantes", () => {
  assert.throws(() =>
    buildPagoConfirmadoComponents({
      customerName: "Ana",
      className: "",
      classDate: "1 de agosto de 2026",
      classTime: "10:00 - 12:00",
    }),
  );
});
