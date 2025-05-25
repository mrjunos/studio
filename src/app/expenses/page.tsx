
"use client";

import { useState, useEffect, useTransition } from "react";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Not used for description, but might be if descriptions get long
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
import { PlusCircle, Edit, Trash2, Loader2, Calendar as CalendarIcon, Receipt } from "lucide-react";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { expenseCategories } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | string>("");
  const [category, setCategory] = useState<ExpenseCategory | undefined>(undefined);
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date());

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (error: any) {
      toast({
        title: "Error Fetching Expenses",
        description: error.message || "Could not load expense data.",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOpenDialog = (expense: Expense | null = null) => {
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
    if (!description || !amount || !category || !expenseDate) {
      toast({ title: "Invalid Input", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    const numericAmount = parseFloat(String(amount));
    if (isNaN(numericAmount) || numericAmount <= 0) {
       toast({ title: "Invalid Amount", description: "Amount must be a positive number.", variant: "destructive" });
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
        toast({ title: editingExpense ? "Expense Updated" : "Expense Added", description: `Entry for ${expenseData.description} processed.` });
        fetchExpenses();
        setIsDialogOpen(false);
      } else {
        toast({ title: "Error", description: result.error || "An unexpected error occurred.", variant: "destructive" });
      }
    });
  };
  
  const handleDeleteConfirmation = async (expenseId: string) => {
     startTransition(async () => {
        const result = await deleteExpense(expenseId);
        if (result.success) {
          toast({ title: "Expense Deleted", description: "The expense entry has been deleted." });
          fetchExpenses();
        } else {
          toast({ title: "Error Deleting", description: result.error || "Failed to delete expense entry.", variant: "destructive" });
        }
     });
  }


  return (
    <div className="p-6">
      <PageTitle 
        title="Expenses" 
        actions={
          <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Expense Entry
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
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.expenseDate), "PPP")}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell><Badge variant="secondary">{expense.category}</Badge></TableCell>
                    <TableCell className="text-right text-red-600 font-semibold">
                      {currencyFormatter.format(expense.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(expense)} className="mr-2 hover:text-accent" disabled={isPending}>
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
                              This action cannot be undone. This will permanently delete the expense entry for "{expense.description}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteConfirmation(expense.id)}
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
                  <TableCell colSpan={5} className="text-center h-24">
                    No expense entries recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Edit Expense Entry" : "Add New Expense Entry"}</DialogTitle>
            <DialogDescription>
              {editingExpense ? "Update the details of this expense entry." : "Record a new expense."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="expense-description">Description</Label>
              <Input 
                id="expense-description" 
                placeholder="e.g., Coffee bean order, Electricity bill"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Amount ($)</Label>
                <Input 
                  id="expense-amount" 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-date">Date</Label>
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
                      {expenseDate ? format(expenseDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expenseDate}
                      onSelect={setExpenseDate}
                      initialFocus
                      disabled={isPending}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="expense-category">Category</Label>
                <Select value={category} onValueChange={(value) => setCategory(value as ExpenseCategory)} disabled={isPending}>
                  <SelectTrigger id="expense-category">
                    <SelectValue placeholder="Select a category" />
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
              <Button type="button" variant="outline" disabled={isPending}>Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSubmitExpense} disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingExpense ? "Save Changes" : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
