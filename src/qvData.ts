export interface QvEntry {
  category: string;
  volumeRange: string;
  value: number;
}

export const QV_DATA: QvEntry[] = [
  { category: "Административные здания", volumeRange: "До 5 тыс. м³", value: 0.09 },
  { category: "Административные здания", volumeRange: "5.01 - 10 тыс. м³", value: 0.08 },
  { category: "Административные здания", volumeRange: "10.01 - 15 тыс. м³", value: 0.07 },
  { category: "Административные здания", volumeRange: "Более 15 тыс. м³", value: 0.16 },

  { category: "Клубы", volumeRange: "До 5 тыс. м³", value: 0.25 },
  { category: "Клубы", volumeRange: "5.01 - 10 тыс. м³", value: 0.23 },
  { category: "Клубы", volumeRange: "Более 10 тыс. м³", value: 0.20 },

  { category: "Кинотеатры", volumeRange: "До 5 тыс. м³", value: 0.43 },
  { category: "Кинотеатры", volumeRange: "5.01 - 10 тыс. м³", value: 0.39 },
  { category: "Кинотеатры", volumeRange: "Более 10 тыс. м³", value: 0.38 },

  { category: "Театры", volumeRange: "До 10 тыс. м³", value: 0.41 },
  { category: "Театры", volumeRange: "10.01 - 15 тыс. м³", value: 0.40 },
  { category: "Театры", volumeRange: "15.01 - 20 тыс. м³", value: 0.38 },
  { category: "Театры", volumeRange: "20.01 - 30 тыс. м³", value: 0.36 },
  { category: "Театры", volumeRange: "Более 30 тыс. м³", value: 0.34 },

  { category: "Универмаги, универсамы, магазины", volumeRange: "До 5 тыс. м³", value: 0.08 },
  { category: "Универмаги, универсамы, магазины", volumeRange: "5.01 - 10 тыс. м³", value: 0.27 },

  { category: "Детские сады и ясли", volumeRange: "До 5 тыс. м³", value: 0.11 },
  { category: "Детские сады и ясли", volumeRange: "Более 5 тыс. м³", value: 0.10 },

  { category: "Школы", volumeRange: "До 5 тыс. м³", value: 0.09 },
  { category: "Школы", volumeRange: "5.01 - 10 тыс. м³", value: 0.08 },
  { category: "Школы", volumeRange: "Более 10 тыс. м³", value: 0.07 },

  { category: "Лабораторные корпуса", volumeRange: "До 5 тыс. м³", value: 1.0 },
  { category: "Лабораторные корпуса", volumeRange: "5.0 - 10 тыс. м³", value: 0.95 },
  { category: "Лабораторные корпуса", volumeRange: "Более 10 тыс. м³", value: 0.90 },

  { category: "ВУЗы, техникумы, колледжи", volumeRange: "10.01 - 15 тыс. м³", value: 0.10 },
  { category: "ВУЗы, техникумы, колледжи", volumeRange: "15.0 - 20 тыс. м³", value: 0.08 },
  { category: "ВУЗы, техникумы, колледжи", volumeRange: "Более 20 тыс. м³", value: 0.08 },

  { category: "Поликлиники, амбулатории, диспансеры", volumeRange: "5.01 - 10 тыс. м³", value: 0.25 },
  { category: "Поликлиники, амбулатории, диспансеры", volumeRange: "10.01 - 15 тыс. м³", value: 0.23 },
  { category: "Поликлиники, амбулатории, диспансеры", volumeRange: "Более 15 тыс. м³", value: 0.22 },

  { category: "Больницы", volumeRange: "До 5 тыс. м³", value: 0.29 },
  { category: "Больницы", volumeRange: "5.01 - 10 тыс. м³", value: 0.28 },
  { category: "Больницы", volumeRange: "10.01 - 15 тыс. м³", value: 0.26 },
  { category: "Больницы", volumeRange: "Более 15 тыс. м³", value: 0.26 },

  { category: "Бани", volumeRange: "До 5 тыс. м³", value: 1.0 },
  { category: "Бани", volumeRange: "5.01 - 10 тыс. м³", value: 0.95 },
];
