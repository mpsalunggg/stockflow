import { Ban } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { useCancelOrder } from "../hooks";
import type { Order } from "../schemas";

type CancelOrderDialogProps = {
  order: Order;
  units: number;
  onClose: () => void;
};

export function CancelOrderDialog({ order, units, onClose }: CancelOrderDialogProps) {
  const cancelOrder = useCancelOrder();

  const confirm = () => {
    cancelOrder.mutate(order.id, {
      onSuccess: () => {
        toast.success(`Order cancelled. ${formatNumber(units)} units returned to stock.`);
        onClose();
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code === "ORDER_ALREADY_CANCELLED") {
          toast.error("This order was already cancelled.");
          onClose();
          return;
        }
        toast.error(error.message);
      },
    });
  };

  return (
    <AlertDialog open onOpenChange={(open) => !open && !cancelOrder.isPending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Ban />
          </AlertDialogMedia>
          <AlertDialogTitle>Cancel order #{order.id}?</AlertDialogTitle>
          <AlertDialogDescription>
            The status will change to CANCELLED and {formatNumber(units)} units will return to
            stock. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelOrder.isPending}>Keep order</AlertDialogCancel>
          <Button variant="destructive" disabled={cancelOrder.isPending} onClick={confirm}>
            {cancelOrder.isPending && <Spinner />}
            {cancelOrder.isPending ? "Cancelling..." : "Cancel order"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
