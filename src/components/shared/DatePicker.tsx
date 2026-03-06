import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const currentYear = new Date().getFullYear();
const years = Array.from(
  { length: currentYear - 1900 + 10 },
  (_, i) => currentYear + 5 - i,
);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  isWeekMode?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày",
  className,
  isWeekMode = false,
}: DatePickerProps) {
  const selectedDate = value ? dayjs(value) : null;
  const startOfWeek = selectedDate
    ? selectedDate.startOf("week").toDate()
    : undefined;
  const endOfWeek = selectedDate
    ? selectedDate.endOf("week").toDate()
    : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            isWeekMode ? (
              `${format(startOfWeek!, "dd/MM/yyyy", { locale: vi })} - ${format(endOfWeek!, "dd/MM/yyyy", { locale: vi })}`
            ) : (
              format(value, "dd/MM/yyyy", { locale: vi })
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex gap-2 p-3 border-b justify-between">
          <Select
            value={value ? value.getDate().toString() : undefined}
            onValueChange={(day) => {
              const current = value ? new Date(value) : new Date();
              current.setDate(parseInt(day));
              onChange(current);
            }}
          >
            <SelectTrigger className="w-20 focus:ring-0">
              <SelectValue placeholder="Ngày" />
            </SelectTrigger>
            <SelectContent className="max-h-50">
              {(() => {
                const current = value ? new Date(value) : new Date();
                const daysInMonth = new Date(
                  current.getFullYear(),
                  current.getMonth() + 1,
                  0,
                ).getDate();
                return Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                  (d) => (
                    <SelectItem key={d} value={d.toString()}>
                      {d}
                    </SelectItem>
                  ),
                );
              })()}
            </SelectContent>
          </Select>

          <Select
            value={value ? (value.getMonth() + 1).toString() : undefined}
            onValueChange={(month) => {
              const current = value ? new Date(value) : new Date();
              current.setMonth(parseInt(month) - 1);
              onChange(current);
            }}
          >
            <SelectTrigger className="w-28 focus:ring-0">
              <SelectValue placeholder="Tháng" />
            </SelectTrigger>
            <SelectContent className="max-h-50">
              {months.map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  Tháng {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={value ? value.getFullYear().toString() : undefined}
            onValueChange={(year) => {
              const current = value ? new Date(value) : new Date();
              current.setFullYear(parseInt(year));
              onChange(current);
            }}
          >
            <SelectTrigger className="w-24 focus:ring-0">
              <SelectValue placeholder="Năm" />
            </SelectTrigger>
            <SelectContent className="max-h-50">
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          locale={vi}
          modifiers={
            isWeekMode && startOfWeek && endOfWeek
              ? {
                  selectedRange: [{ from: startOfWeek, to: endOfWeek }],
                }
              : undefined
          }
          modifiersClassNames={
            isWeekMode
              ? {
                  selectedRange:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                }
              : undefined
          }
        />
      </PopoverContent>
    </Popover>
  );
}
