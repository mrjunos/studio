
"use client";

import { useState, useEffect, useTransition } from "react";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { OtherIncome } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getOtherIncomes, addOtherIncome, updateOtherIncome, deleteOtherIncome, type OtherIncomeFormInput } from "./actions";
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
import { useAuth } from "@/contexts/auth-context";

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function IncomePage() {
  const [incomes, setIncomes] = useState<OtherIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<OtherIncome | null>(null);
  
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | string>(""); 
  const [incomeDate, setIncomeDate] = useState<Date | undefined>(new Date());

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { isLoggedIn } = useAuth();

  const fetchIncomes = async () => {
    setIsLoading(true);
    try {
      const data = await getOtherIncomes();
      setIncomes(data);
    } catch (error: any) {
      toast({
        title: "Error al Cargar Ingresos",
        description: error.message || "No se pudieron cargar los datos de ingresos.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const handleOpenDialog = (income: OtherIncome | null = null) => {
    if (!isLoggedIn) {
      toast({ title: "Acción no permitida", description: "Debes iniciar sesión para gestionar ingresos.", variant: "destructive" });
      return;
    }
    setEditingIncome(income);
    if (income) {
      setDescription(income.description);
      setAmount(income.amount);
      setIncomeDate(new Date(income.incomeDate)); 
    } else {
      setDescription("");
      setAmount("");
      setIncomeDate(new Date());
    }
    setIsDialogOpen(true);
  };

  const handleSubmitIncome = async () => {
    // Auth check done by handleOpenDialog
    if (!description || !amount || !incomeDate) {
      toast({ title: "Entrada Inválida", description: "Por favor, completa todos los campos requeridos.", variant: "destructive" });
      return;
    }
    const numericAmount = parseFloat(String(amount));
    if (isNaN(numericAmount) || numericAmount <= 0) {
       toast({ title: "Monto Inválido", description: "El monto debe ser un número positivo.", variant: "destructive" });
       return;
    }

    const incomeData: OtherIncomeFormInput = { description, amount: numericAmount, incomeDate };

    startTransition(async () => {
      let result;
      if (editingIncome) {
        result = await updateOtherIncome(editingIncome.id, incomeData);
      } else {
        result = await addOtherIncome(incomeData);
      }

      if (result.success) {
        toast({ title: editingIncome ? "Ingreso Actualizado" : "Ingreso Añadido", description: `Entrada para ${incomeData.description} procesada.` });
        fetchIncomes(); 
        setIsDialogOpen(false);
      } else {
        toast({ title: "Error", description: result.error || "Ocurrió un error inesperado.", variant: "destructive" });
      }
    });
  };
  
  const handleDeleteConfirmation = async (incomeId: string) => {
    if (!isLoggedIn) {
      toast({ title: "Acción no permitida", description: "Debes iniciar sesión para eliminar ingresos.", variant: "destructive" });
      return;
    }
     startTransition(async () => {
        const result = await deleteOtherIncome(incomeId);
        if (result.success) {
          toast({ title: "Ingreso Eliminado", description: "La entrada de ingreso ha sido eliminada." });
          fetchIncomes(); 
        } else {
          toast({ title: "Error al Eliminar", description: result.error || "Error al eliminar la entrada de ingreso.", variant: "destructive" });
        }
     });
  }


  return (
    <div className="p-6">
      <PageTitle 
        title="Otros Ingresos" 
        actions={
          <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90" disabled={!isLoggedIn || isPending}>
            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Ingreso
          </Button>
        } 
      />

      {isLoading && incomes.length === 0 ? (
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
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomes.length > 0 ? (
                incomes.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell>{format(new Date(income.incomeDate), "PPP", { locale: es })}</TableCell>
                    <TableCell className="font-medium">{income.description}</TableCell>
                    <TableCell className="text-right text-green-600 font-semibold">
                      {currencyFormatter.format(income.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(income)} className="mr-2 hover:text-accent" disabled={!isLoggedIn || isPending}>
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
                              Esta acción no se puede deshacer. Esto eliminará permanentemente la entrada de ingreso para "{income.description}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteConfirmation(income.id)}
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
                  <TableCell colSpan={4} className="text-center h-24">
                    Aún no hay otras entradas de ingresos registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {isDialogOpen && isLoggedIn && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingIncome ? "Editar Entrada de Ingreso" : "Añadir Nueva Entrada de Ingreso"}</DialogTitle>
              <DialogDescription>
                {editingIncome ? "Actualiza los detalles de esta entrada de ingreso." : "Registra una nueva fuente de otros ingresos."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="income-description">Descripción</Label>
                <Textarea 
                  id="income-description" 
                  placeholder="Ej: Catering de evento, Tarifa de consultoría"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="income-amount">Monto ($)</Label>
                  <Input 
                    id="income-amount" 
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-date">Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="income-date"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !incomeDate && "text-muted-foreground"
                        )}
                        disabled={isPending}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {incomeDate ? format(incomeDate, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={incomeDate}
                        onSelect={setIncomeDate}
                        initialFocus
                        disabled={isPending}
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
               <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" onClick={handleSubmitIncome} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingIncome ? "Guardar Cambios" : "Añadir Entrada"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
