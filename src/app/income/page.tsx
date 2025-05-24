
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

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function IncomePage() {
  const [incomes, setIncomes] = useState<OtherIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<OtherIncome | null>(null);
  
  // Form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | string>(""); // Allow string for input flexibility
  const [incomeDate, setIncomeDate] = useState<Date | undefined>(new Date());

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchIncomes = async () => {
    setIsLoading(true);
    try {
      const data = await getOtherIncomes();
      setIncomes(data);
    } catch (error: any) {
      toast({
        title: "Error Fetching Income",
        description: error.message || "Could not load income data.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const handleOpenDialog = (income: OtherIncome | null = null) => {
    setEditingIncome(income);
    if (income) {
      setDescription(income.description);
      setAmount(income.amount);
      setIncomeDate(new Date(income.incomeDate)); // Parse ISO string to Date
    } else {
      setDescription("");
      setAmount("");
      setIncomeDate(new Date());
    }
    setIsDialogOpen(true);
  };

  const handleSubmitIncome = async () => {
    if (!description || !amount || !incomeDate) {
      toast({ title: "Invalid Input", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    const numericAmount = parseFloat(String(amount));
    if (isNaN(numericAmount) || numericAmount <= 0) {
       toast({ title: "Invalid Amount", description: "Amount must be a positive number.", variant: "destructive" });
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
        toast({ title: editingIncome ? "Income Updated" : "Income Added", description: `Entry for ${incomeData.description} processed.` });
        fetchIncomes(); // Refresh list
        setIsDialogOpen(false);
      } else {
        toast({ title: "Error", description: result.error || "An unexpected error occurred.", variant: "destructive" });
      }
    });
  };
  
  const handleDeleteConfirmation = async (incomeId: string) => {
     startTransition(async () => {
        const result = await deleteOtherIncome(incomeId);
        if (result.success) {
          toast({ title: "Income Deleted", description: "The income entry has been deleted." });
          fetchIncomes(); // Refresh list
        } else {
          toast({ title: "Error Deleting", description: result.error || "Failed to delete income entry.", variant: "destructive" });
        }
     });
  }


  return (
    <>
      <PageTitle 
        title="Other Income" 
        actions={
          <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Income Entry
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
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomes.length > 0 ? (
                incomes.map((income) => (
                  <TableRow key={income.id}>
                    <TableCell>{format(new Date(income.incomeDate), "PPP")}</TableCell>
                    <TableCell className="font-medium">{income.description}</TableCell>
                    <TableCell className="text-right text-green-600 font-semibold">
                      {currencyFormatter.format(income.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(income)} className="mr-2 hover:text-accent" disabled={isPending}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:text-destructive" disabled={isPending}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the income entry for "{income.description}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteConfirmation(income.id)}
                              disabled={isPending}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
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
                    No other income entries recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingIncome ? "Edit Income Entry" : "Add New Income Entry"}</DialogTitle>
            <DialogDescription>
              {editingIncome ? "Update the details of this income entry." : "Record a new source of other income."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="income-description">Description</Label>
              <Textarea 
                id="income-description" 
                placeholder="e.g., Event catering, Consulting fee"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="income-amount">Amount ($)</Label>
                <Input 
                  id="income-amount" 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income-date">Date</Label>
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
                      {incomeDate ? format(incomeDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={incomeDate}
                      onSelect={setIncomeDate}
                      initialFocus
                      disabled={isPending}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
             <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmitIncome} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingIncome ? "Save Changes" : "Add Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
