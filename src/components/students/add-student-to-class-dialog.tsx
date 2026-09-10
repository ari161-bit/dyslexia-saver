"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addStudentToClassAction, type ClassActionResult } from "@/lib/actions/students";

interface StudentOption {
  studentId: string;
  name: string;
}

export function AddStudentToClassDialog({ classId, students }: { classId: string; students: StudentOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ClassActionResult, FormData>(addStudentToClassAction, {});
  const [studentId, setStudentId] = useState("");

  useEffect(() => {
    if (state.success) {
      toast.success("Student added to the class");
      setOpen(false);
      setStudentId("");
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4" /> Add student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a student to this class</DialogTitle>
        </DialogHeader>

        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">Every student in the school is already in this class.</p>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="classId" value={classId} />
            <input type="hidden" name="studentId" value={studentId} />
            <div className="space-y-1.5">
              <Label htmlFor="studentId">Student</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger id="studentId" className="w-full">
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.studentId} value={s.studentId}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
            <Button type="submit" className="w-full" disabled={pending || !studentId}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add to class
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
