
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
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Mock data for income - replace with server actions and DB
let mockIncomes: OtherIncome[] = [];

export default function IncomePage() {
  const [incomes, setIncomes] = useState<OtherIncome[]>(mockIncomes);
  const [isLoading, setIsLoading] = useState(false); // For potential future API calls
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<OtherIncome | null>(null);
  
  // Form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | string>("");
  const [incomeDate, setIncomeDate] = useState<Date | undefined>(new Date());

  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, fetch income data
    setIncomes(mockIncomes.sort((a,b) => new Date(b.incomeDate).getTime() - new Date(a.incomeDate).getTime()));
  }, []);

  const handleOpenDialog = (income: OtherIncome | null = null) => {
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
    if (!description || !amount || !incomeDate) {
      toast({ title: "Invalid Input", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    const numericAmount = parseFloat(String(amount));
    if (isNaN(numericAmount) || numericAmount <= 0) {
       toast({ title: "Invalid Amount", description: "Amount must be a positive number.", variant: "destructive" });
       return;
    }

    startTransition(async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editingIncome) {
        // Update existing income
        const updatedIncomes = incomes.map(inc => 
          inc.id === editingIncome.id 
            ? { ...inc, description, amount: numericAmount, incomeDate } 
            : inc
        );
        mockIncomes = updatedIncomes;
        setIncomes(updatedIncomes.sort((a,b) => new Date(b.incomeDate).getTime() - new Date(a.incomeDate).getTime()));
        toast({ title: "Income Updated", description: "The income entry has been successfully updated." });
      } else {
        // Add new income
        const newIncome: OtherIncome = {
          id: String(Date.now()),
          description,
          amount: numericAmount,
          incomeDate,
        };
        mockIncomes = [newIncome, ...incomes];
        setIncomes(mockIncomes.sort((a,b) => new Date(b.incomeDate).getTime() - new Date(a.incomeDate).getTime()));
        toast({ title: "Income Added", description: "New income entry has been successfully recorded." });
      }
      setIsDialogOpen(false);
    });
  };
  
  const handleDeleteIncome = async (incomeId: string) => {
     startTransition(async () => {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        mockIncomes = incomes.filter(inc => inc.id !== incomeId);
        setIncomes(mockIncomes);
        toast({ title: "Income Deleted", description: "The income entry has been deleted." });
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
                    <TableCell className="text-right text-green-600 font-semibold">${income.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(income)} className="mr-2 hover:text-accent">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteIncome(income.id)} className="hover:text-destructive" disabled={isPending}>
                        {isPending && editingIncome?.id !== income.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                      </Button>
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
