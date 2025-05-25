
"use client";

import { useState, useEffect, useTransition } from "react";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { PlusCircle, Edit, Trash2, Loader2, Calendar as CalendarIcon } from "lucide-react";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { expenseCategories } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getExpenses, addExpense, updateExpense, deleteExpense, type ExpenseFormInput } from "./actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | string>("");
  const [category, setCategory] = useState<ExpenseCategory | undefined>(undefined);
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date());

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { isLoggedIn } = useAuth();

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (error: any) {
      toast({
        title: "Error al Cargar Gastos",
        description: error.message || "No se pudieron cargar los datos de gastos.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOpenDialog = (expense: Expense | null = null) => {
    if (!isLoggedIn) {
      toast({ title: "Acción no permitida", description: "Debes iniciar sesión para gestionar gastos.", variant: "destructive" });
      return;
    }
    setEditingExpense(expense);
    if (expense) {
      setDescription(expense.description);
      setAmount(expense.amount);
      setCategory(expense.category);
      setExpenseDate(new Date(expense.expenseDate));
    } else {
      setDescription("");
      setAmount("");
      setCategory(undefined);
      setExpenseDate(new Date());
    }
    setIsDialogOpen(true);
  };

  const handleSubmitExpense = async () => {
    // Auth check done by handleOpenDialog
    if (!description || !amount || !category || !expenseDate) {
      toast({ title: "Entrada Inválida", description: "Por favor, completa todos los campos requeridos.", variant: "destructive" });
      return;
    }
    const numericAmount = parseFloat(String(amount));
    if (isNaN(numericAmount) || numericAmount <= 0) {
       toast({ title: "Monto Inválido", description: "El monto debe ser un número positivo.", variant: "destructive" });
       return;
    }

    const expenseData: ExpenseFormInput = { description, amount: numericAmount, category, expenseDate };

    startTransition(async () => {
      let result;
      if (editingExpense) {
        result = await updateExpense(editingExpense.id, expenseData);
      } else {
        result = await addExpense(expenseData);
      }

      if (result.success) {
        toast({ title: editingExpense ? "Gasto Actualizado" : "Gasto Añadido", description: `Entrada para ${expenseData.description} procesada.` });
        fetchExpenses();
        setIsDialogOpen(false);
      } else {
        toast({ title: "Error", description: result.error || "Ocurrió un error inesperado.", variant: "destructive" });
      }
    });
  };
  
  const handleDeleteConfirmation = async (expenseId: string) => {
    if (!isLoggedIn) {
      toast({ title: "Acción no permitida", description: "Debes iniciar sesión para eliminar gastos.", variant: "destructive" });
      return;
    }
     startTransition(async () => {
        const result = await deleteExpense(expenseId);
        if (result.success) {
          toast({ title: "Gasto Eliminado", description: "La entrada de gasto ha sido eliminada." });
          fetchExpenses();
        } else {
          toast({ title: "Error al Eliminar", description: result.error || "Error al eliminar la entrada de gasto.", variant: "destructive" });
        }
     });
  }


  return (
    <div className="p-6">
      <PageTitle 
        title="Gastos" 
        actions={
          <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90" disabled={!isLoggedIn || isPending}>
            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Gasto
          </Button>
        } 
      />

      {isLoading && expenses.length === 0 ? (
         <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.expenseDate), "PPP", { locale: es })}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell><Badge variant="secondary">{expense.category}</Badge></TableCell>
                    <TableCell className="text-right text-red-600 font-semibold">
                      {currencyFormatter.format(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(expense)} className="mr-2 hover:text-accent" disabled={!isLoggedIn || isPending}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:text-destructive" disabled={!isLoggedIn || isPending}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará permanentemente la entrada de gasto para "{expense.description}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteConfirmation(expense.id)}
                              disabled={isPending}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Eliminar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Aún no hay entradas de gastos registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {isDialogOpen && isLoggedIn && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Editar Entrada de Gasto" : "Añadir Nueva Entrada de Gasto"}</DialogTitle>
              <DialogDescription>
                {editingExpense ? "Actualiza los detalles de esta entrada de gasto." : "Registra un nuevo gasto."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="expense-description">Descripción</Label>
                <Input 
                  id="expense-description" 
                  placeholder="Ej: Pedido de granos de café, Factura de luz"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Monto ($)</Label>
                  <Input 
                    id="expense-amount" 
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="expense-date"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !expenseDate && "text-muted-foreground"
                        )}
                        disabled={isPending}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expenseDate ? format(expenseDate, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={expenseDate}
                        onSelect={setExpenseDate}
                        initialFocus
                        disabled={isPending}
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="expense-category">Categoría</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as ExpenseCategory)} disabled={isPending}>
                    <SelectTrigger id="expense-category">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
            </div>
            <DialogFooter>
               <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" onClick={handleSubmitExpense} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingExpense ? "Guardar Cambios" : "Añadir Gasto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
