import { useState } from "react";
import type { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormFooter } from "./FormFooter";
import type { CreateFlashcardFormValues, ValidationErrors } from "@/types";

interface FlashcardFormProps {
  onSubmit: (values: CreateFlashcardFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
}

const MAX_FRONT_LENGTH = 200;
const MAX_BACK_LENGTH = 500;

export function FlashcardForm({ onSubmit, onCancel, loading = false }: FlashcardFormProps) {
  const [values, setValues] = useState<CreateFlashcardFormValues>({
    front: "",
    back: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState({
    front: false,
    back: false,
  });

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    const frontTrimmed = values.front.trim();
    if (frontTrimmed.length === 0) {
      newErrors.front = "Front text is required";
    } else if (frontTrimmed.length > MAX_FRONT_LENGTH) {
      newErrors.front = `Front text must be ${MAX_FRONT_LENGTH} characters or less`;
    }

    const backTrimmed = values.back.trim();
    if (backTrimmed.length === 0) {
      newErrors.back = "Back text is required";
    } else if (backTrimmed.length > MAX_BACK_LENGTH) {
      newErrors.back = `Back text must be ${MAX_BACK_LENGTH} characters or less`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ front: true, back: true });

    if (validate()) {
      onSubmit(values);
    }
  };

  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, front: e.target.value }));
    if (touched.front) {
      // Re-validate on change if field was already touched
      validate();
    }
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValues((prev) => ({ ...prev, back: e.target.value }));
    if (touched.back) {
      // Re-validate on change if field was already touched
      validate();
    }
  };

  const handleFrontBlur = () => {
    setTouched((prev) => ({ ...prev, front: true }));
    validate();
  };

  const handleBackBlur = () => {
    setTouched((prev) => ({ ...prev, back: true }));
    validate();
  };

  const isFormValid =
    values.front.trim().length > 0 &&
    values.front.trim().length <= MAX_FRONT_LENGTH &&
    values.back.trim().length > 0 &&
    values.back.trim().length <= MAX_BACK_LENGTH;

  const isDisabled = loading || !isFormValid;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="front" className="text-sm font-medium">
          Front
          <span className="text-destructive ml-1">*</span>
        </label>
        <Input
          id="front"
          type="text"
          value={values.front}
          onChange={handleFrontChange}
          onBlur={handleFrontBlur}
          disabled={loading}
          aria-invalid={touched.front && !!errors.front}
          placeholder="Enter the question or prompt"
          className="w-full"
        />
        <div className="flex justify-between items-start min-h-[20px]">
          {touched.front && errors.front ? <p className="text-sm text-destructive">{errors.front}</p> : <div />}
          <p
            className={`text-sm ${values.front.length > MAX_FRONT_LENGTH ? "text-destructive" : "text-muted-foreground"}`}
          >
            {values.front.length}/{MAX_FRONT_LENGTH}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="back" className="text-sm font-medium">
          Back
          <span className="text-destructive ml-1">*</span>
        </label>
        <Textarea
          id="back"
          value={values.back}
          onChange={handleBackChange}
          onBlur={handleBackBlur}
          disabled={loading}
          aria-invalid={touched.back && !!errors.back}
          placeholder="Enter the answer or explanation"
          className="w-full min-h-32"
          rows={6}
        />
        <div className="flex justify-between items-start min-h-[20px]">
          {touched.back && errors.back ? <p className="text-sm text-destructive">{errors.back}</p> : <div />}
          <p
            className={`text-sm ${values.back.length > MAX_BACK_LENGTH ? "text-destructive" : "text-muted-foreground"}`}
          >
            {values.back.length}/{MAX_BACK_LENGTH}
          </p>
        </div>
      </div>

      <FormFooter disabled={isDisabled} onCancel={onCancel} onSave={() => undefined} />
    </form>
  );
}
