type ChildWithId = {
  id: string;
};

type PaymentWithChild = {
  id: string;
  childId: string;
  amount: number;
  date: string;
};

export function groupPaymentsByChild<
  TChild extends ChildWithId,
  TPayment extends PaymentWithChild,
>(children: readonly TChild[], payments: readonly TPayment[]) {
  return children.map((child) => {
    const childPayments = payments
      .filter((payment) => payment.childId === child.id)
      .sort((a, b) => {
        const dateOrder = b.date.localeCompare(a.date);
        return dateOrder !== 0 ? dateOrder : b.id.localeCompare(a.id);
      });

    return {
      child,
      payments: childPayments,
      total: childPayments.reduce((sum, payment) => sum + payment.amount, 0),
    };
  });
}
