import { Ban, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
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
import { useDeleteProduct } from "../hooks";
import type { Product } from "../schemas";

type DeleteProductDialogProps = {
  product: Product;
  onClose: () => void;
  onDeleted: () => void;
};

export function DeleteProductDialog({
  product,
  onClose,
  onDeleted,
}: DeleteProductDialogProps) {
  const [blocked, setBlocked] = useState(false);
  const deleteProduct = useDeleteProduct();

  const confirm = () => {
    deleteProduct.mutate(product.id, {
      onSuccess: () => {
        toast.success(`${product.name} was deleted.`);
        onDeleted();
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code === "PRODUCT_HAS_HISTORY") {
          setBlocked(true);
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          toast.error(`${product.name} was already deleted.`);
          onClose();
          return;
        }
        toast.error(error.message);
      },
    });
  };

  const name = (
    <>
      <strong className="font-semibold text-foreground">{product.name}</strong> (
      <span className="font-mono text-xs">{product.sku}</span>)
    </>
  );

  return (
    <AlertDialog
      open
      onOpenChange={(open) => !open && !deleteProduct.isPending && onClose()}
    >
      <AlertDialogContent>
        {blocked ? (
          <>
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-destructive/10 text-destructive">
                <Ban />
              </AlertDialogMedia>
              <AlertDialogTitle>This product can't be deleted</AlertDialogTitle>
              <AlertDialogDescription>
                {name} has stock or order history. Nothing was deleted, and the
                product and its history are unchanged.
                <span className="mt-2 block font-mono text-xs">
                  409 · PRODUCT_HAS_HISTORY
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link to={`/stock?product=${product.id}`} />}
              >
                View history
              </Button>
              <AlertDialogCancel variant="default">Got it</AlertDialogCancel>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-destructive/10 text-destructive">
                <Trash2 />
              </AlertDialogMedia>
              <AlertDialogTitle>Delete product?</AlertDialogTitle>
              <AlertDialogDescription>
                {name} will be removed from your catalog. This can't be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteProduct.isPending}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={deleteProduct.isPending}
                onClick={confirm}
              >
                {deleteProduct.isPending && <Spinner />}
                {deleteProduct.isPending ? "Deleting..." : "Delete product"}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
