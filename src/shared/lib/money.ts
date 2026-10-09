/**
 * Redondea un monto no negativo a centavos, con la mitad hacia arriba, igual que
 * `round_money` en faclab-core. `toPrecision(15)` descarta el error binario
 * (2.675 × 100 = 267.49999…) antes de redondear.
 */
export function roundMoney(value: number): number {
    return Math.round(Number((value * 100).toPrecision(15))) / 100
}
