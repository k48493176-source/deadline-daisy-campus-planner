import { Clock, MapPin, Trash2 } from "lucide-react";
import { colorDot } from "@/lib/planner";
import { hhmm, type ClassSlot } from "@/lib/timetable";

export function ClassItem({ c, onDelete }: { c: ClassSlot; onDelete?: () => void }) {
  return (
    <li className="flex items-center gap-3 p-3">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colorDot[c.courses?.color ?? "sage"]}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{c.courses?.code} · {c.courses?.name}</p>
        <p className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{hhmm(c.start_time)}–{hhmm(c.end_time)}</span>
          {c.room && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{c.room}</span>}
        </p>
      </div>
      {onDelete && (
        <button type="button" className="btn-ghost min-h-11 px-3" onClick={onDelete}
          aria-label={`Delete ${c.courses?.code ?? ""} class at ${hhmm(c.start_time)}`}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </li>
  );
}
