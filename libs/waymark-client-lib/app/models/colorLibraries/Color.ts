export default class Color {
  hexCode: string;
  displayName: string;
  order: number;
  updatedAt: Date | null;

  constructor({
    hexCode,
    displayName,
    order,
    updatedAt,
  }: {
    hexCode: string;
    displayName: string;
    order: number;
    updatedAt: string | null;
  }) {
    this.hexCode = hexCode;
    this.displayName = displayName || hexCode;
    this.order = order;
    this.updatedAt = updatedAt ? new Date(updatedAt) : null;
  }
}
