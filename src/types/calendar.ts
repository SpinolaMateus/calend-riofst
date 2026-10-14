export interface CorporateEvent {
  id: string;
  date: string;       // YYYY-MM-DD
  title: string;
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  duration: string;   // e.g. "1h 30min"
  category: string;   // "Reunião" | "Treinamento" | "Consultoria" | "Liderança" | "Geral"
  location: string;   // Room e.g. "Aroeira", "Bambuzal"
  description: string;
}

export type EventCategory = 'Reunião' | 'Treinamento' | 'Consultoria' | 'Liderança' | 'Geral';

export interface CloudStatus {
  connected: boolean;
  message: string;
  rowCount: number;
}
