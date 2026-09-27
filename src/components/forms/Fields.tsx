import type { InputHTMLAttributes } from 'react';

export function FieldErrors({ errors }: { errors?: string[] }) {
    if (!errors || errors.length === 0) return null;
    return (
        <div className="label">
            <span className="label-text-alt text-error">{errors.join(' ')}</span>
        </div>
    );
}

export function FormAlert({ message }: { message: string | null }) {
    if (!message) return null;
    return (
        <div role="alert" className="alert alert-error py-2 text-sm">
            <span>{message}</span>
        </div>
    );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'className'> & {
    label: string;
    name: string;
    value: string;
    onChange: (value: string) => void;
    errors?: string[];
};

export function TextField({ label, name, value, onChange, errors, ...rest }: TextFieldProps) {
    const invalid = Boolean(errors && errors.length > 0);
    return (
        <label className="form-control w-full">
            <div className="label">
                <span className="label-text">{label}</span>
            </div>
            <input
                id={name}
                name={name}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                aria-invalid={invalid || undefined}
                className={`input input-bordered w-full ${invalid ? 'input-error' : ''}`}
                {...rest}
            />
            <FieldErrors errors={errors} />
        </label>
    );
}
