import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PasswordField(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  const label = props["aria-label"] || "Password";
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className="field w-full pr-12" />
      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2"
        aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} title={`${visible ? "Hide" : "Show"} password`}
        aria-pressed={visible} onClick={() => setVisible((value) => !value)}>
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
  );
}