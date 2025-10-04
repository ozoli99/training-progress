import { z } from "zod";

export function makeZodFormikValidate<TSchema extends z.ZodTypeAny>(schema: TSchema) {
    return (values: z.infer<TSchema>) => {
        const parsed = schema.safeParse(values);
        if (parsed.success) {
            return {};
        }

        const { fieldErrors, formErrors } = parsed.error.flatten() as {
            fieldErrors: Record<string, string[] | undefined>;
            formErrors: string[];
        };

        const errors: Record<string, string> = {};

        (Object.entries(fieldErrors) as [string, string[] | undefined][]).forEach(([key, msgs]) => {
            if (msgs && msgs.length) {
                errors[key] = msgs[0]!;
            }
        });

        if (formErrors.length) {
            errors["FORM_ERROR"] = formErrors[0];
        }
        
        return errors;
    };
}