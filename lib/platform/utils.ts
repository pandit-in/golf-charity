export function formatCurrency(valueCents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(valueCents / 100)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export function formatMonthLabel(month: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T00:00:00`))
}

export function cnNumberList(numbers: number[] | null) {
  if (!numbers?.length) {
    return "Waiting for simulation"
  }

  return numbers.map((number) => number.toString().padStart(2, "0")).join(" · ")
}
