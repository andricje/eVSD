import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { countries } from "@/types/donors";

export function CountryCombobox({
  onSelect,
}: {
  onSelect?: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<{
    code: string;
    name: string;
  } | null>(null);

  const handleSelect = (country: { code: string; name: string }) => {
    setSelected(country);
    setOpen(false);
    onSelect?.(country.code);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between"
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <span
                className={`fi fi-${selected.code.toLowerCase()} fis rounded-full`}
              ></span>
              {selected.name}
            </span>
          ) : (
            "Изаберите државу"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Претражите државу..." />
          <CommandList>
            <CommandEmpty>Нема резултата.</CommandEmpty>
            {countries.map((country) => (
              <CommandItem
                key={country.code}
                value={country.name}
                onSelect={() => handleSelect(country)}
              >
                <span
                  className={`fi fi-${country.code.toLowerCase()} fis rounded-full`}
                ></span>
                {country.name}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
