
export interface Calculator {
  id: string;
  name: string;
  category: 'dashboard' | 'scores' | 'neuro' | 'hemo' | 'resp' | 'renal' | 'acid-base';
  description: string;
}

export interface GCSState {
  eyes: number;
  verbal: number;
  motor: number;
}

export interface MAPState {
  systolic: number;
  diastolic: number;
}

export interface PFState {
  pao2: number;
  fio2: number; // as percentage
}

export interface RenalState {
  age: number;
  weight: number;
  creatinine: number;
  gender: 'male' | 'female';
}

export interface FastHugState {
  feeding: boolean;
  analgesia: boolean;
  sedation: boolean;
  thromboembolic: boolean;
  headOfBed: boolean;
  ulcer: boolean;
  glucose: boolean;
}

export interface SofaState {
  respiratory: number; // 0-4
  coagulation: number; // 0-4
  liver: number; // 0-4
  cardiovascular: number; // 0-4
  neurological: number; // 0-4
  renal: number; // 0-4
}
