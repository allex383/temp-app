export interface Q0Entry {
  category: string;
  subCategory?: string;
  volumeRange: string;
  value: number;
  description?: string;
}

export const Q0_DATA: Q0Entry[] = [
  // --- Общественные здания (t0 = -30°C) ---
  { category: "Административные здания", volumeRange: "До 5 тыс. м³", value: 0.43 },
  { category: "Административные здания", volumeRange: "5.01 - 10 тыс. м³", value: 0.38 },
  { category: "Административные здания", volumeRange: "10.01 - 15 тыс. м³", value: 0.35 },
  { category: "Административные здания", volumeRange: "Более 15 тыс. м³", value: 0.32 },

  { category: "Клубы", volumeRange: "До 5 тыс. м³", value: 0.37 },
  { category: "Клубы", volumeRange: "5.01 - 10 тыс. м³", value: 0.33 },
  { category: "Клубы", volumeRange: "Более 10 тыс. м³", value: 0.30 },

  { category: "Кинотеатры", volumeRange: "До 5 тыс. м³", value: 0.36 },
  { category: "Кинотеатры", volumeRange: "5.01 - 10 тыс. м³", value: 0.32 },
  { category: "Кинотеатры", volumeRange: "Более 10 тыс. м³", value: 0.30 },

  { category: "Театры", volumeRange: "До 10 тыс. м³", value: 0.29 },
  { category: "Театры", volumeRange: "10.01 - 15 тыс. м³", value: 0.27 },
  { category: "Театры", volumeRange: "15.01 - 20 тыс. м³", value: 0.22 },
  { category: "Театры", volumeRange: "20.01 - 30 тыс. м³", value: 0.20 },
  { category: "Театры", volumeRange: "Более 30 тыс. м³", value: 0.18 },

  { category: "Универмаги, универсамы, магазины", volumeRange: "До 5 тыс. м³", value: 0.38 },
  { category: "Универмаги, универсамы, магазины", volumeRange: "5.01 - 10 тыс. м³", value: 0.33 },
  { category: "Универмаги, универсамы, магазины", volumeRange: "Более 10 тыс. м³", value: 0.31 },

  { category: "Детские сады и ясли", volumeRange: "До 5 тыс. м³", value: 0.38 },
  { category: "Детские сады и ясли", volumeRange: "Более 5 тыс. м³", value: 0.34 },

  { category: "Школы", volumeRange: "До 5 тыс. м³", value: 0.39 },
  { category: "Школы", volumeRange: "5.01 - 10 тыс. м³", value: 0.35 },
  { category: "Школы", volumeRange: "Более 10 тыс. м³", value: 0.33 },

  { category: "Лабораторные корпуса", volumeRange: "До 5 тыс. м³", value: 0.37 },
  { category: "Лабораторные корпуса", volumeRange: "5.01 - 10 тыс. м³", value: 0.35 },
  { category: "Лабораторные корпуса", volumeRange: "Более 10 тыс. м³", value: 0.33 },

  { category: "ВУЗы, техникумы, колледжи", volumeRange: "До 10 тыс. м³", value: 0.35 },
  { category: "ВУЗы, техникумы, колледжи", volumeRange: "10.01 - 15 тыс. м³", value: 0.33 },
  { category: "ВУЗы, техникумы, колледжи", volumeRange: "15.01 - 20 тыс. м³", value: 0.30 },
  { category: "ВУЗы, техникумы, колледжи", volumeRange: "Более 20 тыс. м³", value: 0.24 },

  { category: "Поликлиники, амбулатории, диспансеры", volumeRange: "До 5 тыс. м³", value: 0.40 },
  { category: "Поликлиники, амбулатории, диспансеры", volumeRange: "5.01 - 10 тыс. м³", value: 0.36 },
  { category: "Поликлиники, амбулатории, диспансеры", volumeRange: "10.01 - 15 тыс. м³", value: 0.32 },
  { category: "Поликлиники, амбулатории, диспансеры", volumeRange: "Более 15 тыс. м³", value: 0.30 },

  { category: "Больницы", volumeRange: "До 5 тыс. м³", value: 0.40 },
  { category: "Больницы", volumeRange: "5.01 - 10 тыс. м³", value: 0.36 },
  { category: "Больницы", volumeRange: "10.01 - 15 тыс. м³", value: 0.32 },
  { category: "Больницы", volumeRange: "Более 15 тыс. м³", value: 0.30 },

  { category: "Бани", volumeRange: "До 5 тыс. м³", value: 0.28 },
  { category: "Бани", volumeRange: "5.01 - 10 тыс. м³", value: 0.25 },
  { category: "Бани", volumeRange: "Более 10 тыс. м³", value: 0.23 },

  { category: "Прачечные", volumeRange: "До 5 тыс. м³", value: 0.38 },
  { category: "Прачечные", volumeRange: "5.01 - 10 тыс. м³", value: 0.33 },
  { category: "Прачечные", volumeRange: "Более 10 тыс. м³", value: 0.31 },

  { category: "Гостиницы", volumeRange: "До 5 тыс. м³", value: 0.43 },
  { category: "Гостиницы", volumeRange: "5.01 - 10 тыс. м³", value: 0.38 },
  { category: "Гостиницы", volumeRange: "10.01 - 15 тыс. м³", value: 0.45 },
  { category: "Гостиницы", volumeRange: "Более 15 тыс. м³", value: 0.32 },

  { category: "Общественное питание (рестораны, кафе)", volumeRange: "До 5 тыс. м³", value: 0.35 },
  { category: "Общественное питание (рестораны, кафе)", volumeRange: "5.01 - 10 тыс. м³", value: 0.33 },
  { category: "Общественное питание (рестораны, кафе)", volumeRange: "Более 10 тыс. м³", value: 0.30 },

  { category: "Пожарные депо", volumeRange: "До 2 тыс. м³", value: 0.48 },
  { category: "Пожарные депо", volumeRange: "2.01 - 5 тыс. м³", value: 0.46 },
  { category: "Пожарные депо", volumeRange: "Более 5 тыс. м³", value: 0.45 },

  { category: "Гаражи", volumeRange: "До 2 тыс. м³", value: 0.70 },
  { category: "Гаражи", volumeRange: "2.01 - 3 тыс. м³", value: 0.60 },
  { category: "Гаражи", volumeRange: "3.01 - 5 тыс. м³", value: 0.55 },
  { category: "Гаражи", volumeRange: "Более 5 тыс. м³", value: 0.50 },

  // --- Жилые здания (1930-1958 гг.) ---
  { category: "Жилые здания (1930-1958 гг.)", volumeRange: "100 м³", value: 0.74 },
  { category: "Жилые здания (1930-1958 гг.)", volumeRange: "200 м³", value: 0.66 },
  { category: "Жилые здания (1930-1958 гг.)", volumeRange: "300 м³", value: 0.62 },
  { category: "Жилые здания (1930-1958 гг.)", volumeRange: "400 м³", value: 0.60 },
  { category: "Жилые здания (1930-1958 гг.)", volumeRange: "500 м³", value: 0.58 },
  { category: "Жилые здания (1930-1958 гг.)", volumeRange: "1000 м³", value: 0.51 },
  { category: "Жилые здания (1930-1958 гг.)", volumeRange: "2000 м³", value: 0.45 },
  { category: "Жилые здания (1930-1958 гг.)", volumeRange: "5000 м³", value: 0.38 },
  { category: "Жилые здания (1930-1958 гг.)", volumeRange: "10000 м³", value: 0.33 },
  { category: "Жилые здания (1930-1958 гг.)", volumeRange: "20000 м³", value: 0.28 },
  { category: "Жилые здания (1930-1958 гг.)", volumeRange: "50000 м³", value: 0.26 },

  // --- Жилые здания (после 1958 г.) ---
  { category: "Жилые здания (после 1958 г.)", volumeRange: "100 м³", value: 0.92 },
  { category: "Жилые здания (после 1958 г.)", volumeRange: "200 м³", value: 0.82 },
  { category: "Жилые здания (после 1958 г.)", volumeRange: "300 м³", value: 0.78 },
  { category: "Жилые здания (после 1958 г.)", volumeRange: "400 м³", value: 0.74 },
  { category: "Жилые здания (после 1958 г.)", volumeRange: "500 м³", value: 0.71 },
  { category: "Жилые здания (после 1958 г.)", volumeRange: "1000 м³", value: 0.65 },
  { category: "Жилые здания (после 1958 г.)", volumeRange: "2000 м³", value: 0.53 },
  { category: "Жилые здания (после 1958 г.)", volumeRange: "5000 м³", value: 0.45 },
  { category: "Жилые здания (после 1958 г.)", volumeRange: "10000 м³", value: 0.39 },
  { category: "Жилые здания (после 1958 г.)", volumeRange: "20000 м³", value: 0.37 },
  { category: "Жилые здания (после 1958 г.)", volumeRange: "50000 м³", value: 0.34 },

  // --- Жилые здания (до 1930 г.) ---
  { category: "Жилые здания (до 1930 г.)", subCategory: "t0 ниже -30°C", volumeRange: "500 - 2000 м³", value: 0.370 },
  { category: "Жилые здания (до 1930 г.)", subCategory: "t0 ниже -30°C", volumeRange: "2001 - 5000 м³", value: 0.280 },
  { category: "Жилые здания (до 1930 г.)", subCategory: "t0 ниже -30°C", volumeRange: "5001 - 10000 м³", value: 0.240 },
  { category: "Жилые здания (до 1930 г.)", subCategory: "t0 ниже -30°C", volumeRange: "Более 25000 м³", value: 0.185 },

  { category: "Жилые здания (до 1930 г.)", subCategory: "t0 от -20°C до -30°C", volumeRange: "500 - 2000 м³", value: 0.410 },
  { category: "Жилые здания (до 1930 г.)", subCategory: "t0 от -20°C до -30°C", volumeRange: "2001 - 5000 м³", value: 0.300 },
  { category: "Жилые здания (до 1930 г.)", subCategory: "t0 от -20°C до -30°C", volumeRange: "5001 - 10000 м³", value: 0.265 },
  { category: "Жилые здания (до 1930 г.)", subCategory: "t0 от -20°C до -30°C", volumeRange: "Более 25000 м³", value: 0.195 },

  { category: "Жилые здания (до 1930 г.)", subCategory: "t0 выше -20°C", volumeRange: "500 - 2000 м³", value: 0.450 },
  { category: "Жилые здания (до 1930 г.)", subCategory: "t0 выше -20°C", volumeRange: "2001 - 5000 м³", value: 0.380 },
  { category: "Жилые здания (до 1930 г.)", subCategory: "t0 выше -20°C", volumeRange: "5001 - 10000 м³", value: 0.285 },
  { category: "Жилые здания (до 1930 г.)", subCategory: "t0 выше -20°C", volumeRange: "Более 25000 м³", value: 0.215 },
];

export interface ToEntry {
  period: string;
  value: number;
  note?: string;
}

export const TO_DATA: ToEntry[] = [
  { period: "Здания до 2018 года постройки", value: -28, note: "Постройки до 2017 года включительно" },
  { period: "Здания 2018-2020 года постройки", value: -25, note: "Включительно 2018, 2019 и 2020 годы" },
  { period: "Здания после 2020 года постройки", value: -26, note: "Постройки начиная с 2021 года" },
];

export interface TiEntry {
  roomType: string;
  value: number;
  note?: string;
}

export const TI_DATA: TiEntry[] = [
  { roomType: "Жилые помещения", value: 20 },
  { roomType: "Гостиницы, общежития", value: 20 },
  { roomType: "Административные здания", value: 20 },
  { roomType: "Детские сады, ясли, поликлиники, больницы", value: 21 },
  { roomType: "Родильные дома", value: 22 },
  { roomType: "Общепит, клубы, театры", value: 21 },
  { roomType: "ВУЗы, техникумы, школы-интернаты", value: 21 },
  { roomType: "Учебные мастерские", value: 20 },
  { roomType: "Кружковые помещения", value: 21 },
  { roomType: "Парикмахерские, салоны красоты", value: 22 },
  { roomType: "Кинотеатры", value: 20 },
  { roomType: "Гаражи", value: 12 },
  { roomType: "Отапливаемые стоянки автомобилей", value: 10 },
  { roomType: "Бани", value: 25 },
  { roomType: "Торговые залы магазинов", value: 16 },
  { roomType: "Разгрузочные помещения", value: 10 },
  { roomType: "Кладовые (хлеб, кондитерские)", value: 16 },
  { roomType: "Кладовые (скоропортящиеся, напитки)", value: 8 },
  { roomType: "Кладовые (прочие товары)", value: 16 },
  { roomType: "Бельевая", value: 20 },
  { roomType: "Мастерские, лаборатории", value: 20 },
  { roomType: "Цеха промышленных предприятий", value: 18 },
  { roomType: "Конторские помещения, касса, охрана", value: 20 },
  { roomType: "Душевые", value: 25 },
  { roomType: "Помещения приема и выдачи заказов", value: 18 },
  { roomType: "Туалеты (общественные и персонал)", value: 16 },
  { roomType: "Зрительный зал с эстрадой, сценой", value: 20 },
  { roomType: "Бассейны спортивные", value: 30 },
  { roomType: "Бассейны оздоровительные", value: 33 },
];
