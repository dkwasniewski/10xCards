import { Button } from "@/components/ui/button";

interface FormFooterProps {
  disabled: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function FormFooter({ disabled, onCancel, onSave }: FormFooterProps) {
  return (
    <div className="flex justify-end gap-3 pt-4">
      <Button type="button" variant="outline" onClick={onCancel} disabled={disabled}>
        Cancel
      </Button>
      <Button type="submit" onClick={onSave} disabled={disabled}>
        Save
      </Button>
    </div>
  );
}
