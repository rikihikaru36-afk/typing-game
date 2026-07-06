import { TyperacerQuote, AvatarOption } from "./types";

export const AVATARS: AvatarOption[] = [
  {
    type: "car",
    emoji: "🏎️",
    name: "Уралдааны машин",
    color: "from-red-500 to-orange-500",
    bgColor: "bg-red-500/10",
    trailColor: "bg-red-500/20"
  },
  {
    type: "rocket",
    emoji: "🚀",
    name: "Сансрын хөлөг",
    color: "from-indigo-500 to-purple-500",
    bgColor: "bg-indigo-500/10",
    trailColor: "bg-indigo-500/20"
  },
  {
    type: "horse",
    emoji: "🐎",
    name: "Хурдан хүлэг",
    color: "from-amber-600 to-yellow-500",
    bgColor: "bg-amber-500/10",
    trailColor: "bg-amber-500/20"
  }
];

export const QUOTES: TyperacerQuote[] = [
  // MONGOLIAN QUOTES
  {
    id: "mn-01",
    text: "Эрдэм сурахыг багаас нь хичээвэл хөгшрөхөд түүний ач тус нь далай мэт арвин болно.",
    source: "Монгол Ардын Зүйр Цэцэн Үг",
    difficulty: "Easy",
    language: "mn"
  },
  {
    id: "mn-02",
    text: "Хүн болох багаасаа хүлэг болох унаганаасаа гэдэг шиг амжилтын үндэс нь залуу насны хичээл зүтгэлээс шууд хамаарна.",
    source: "Амьдралын сургамж",
    difficulty: "Medium",
    language: "mn"
  },
  {
    id: "mn-03",
    text: "Монгол эх орон минь уудам дэлгэр нутагтай, ухаалаг ард түмэнтэй, урт удаан түүх соёлтой агуу баялаг билээ.",
    source: "Эх орны тухай",
    difficulty: "Medium",
    language: "mn"
  },
  {
    id: "mn-04",
    text: "Зорилгогүй амьдрал бол чиг заагчгүй усан онгоцтой адил юм. Тиймээс өдөр бүр урагшлах тодорхой зорилготой бай.",
    source: "Хувь хүний хөгжил",
    difficulty: "Easy",
    language: "mn"
  },
  {
    id: "mn-05",
    text: "Тэвчээр бол амжилтын түлхүүр бөгөөд хүнд хэцүү цаг үед ч өөрийн хүсэл мөрөөдөлдөө үнэнч үлдэхийг хэлнэ.",
    source: "Сэтгэлийн хүч",
    difficulty: "Medium",
    language: "mn"
  },
  {
    id: "mn-06",
    text: "Хөх тэнгэрт гялалзах одод шиг, хөндий талд ургах цэцэгс шиг, хүмүүн бидний амьдрал ч мөн өөр өөрийн гэсэн өнгө аястай гайхамшигтай юм.",
    source: "Уран зохиол",
    difficulty: "Hard",
    language: "mn"
  },
  {
    id: "mn-07",
    text: "Бусдыг хүндэтгэх нь өөрийгөө хүндэтгэхийн нэгэн адил бөгөөд эв эеийг хичээж явах нь эрхэм сайн чанар мөн билээ.",
    source: "Ёс суртахуун",
    difficulty: "Easy",
    language: "mn"
  },
  {
    id: "mn-08",
    text: "Үнэнийг хэлэхэд, програм хангамжийн хөгжүүлэлт бол маш нарийн төвөгтэй бөгөөд үргэлж шинэ зүйлийг тасралтгүй суралцахыг шаарддаг мэргэжил юм.",
    source: "Код бичигчийн тэмдэглэл",
    difficulty: "Hard",
    language: "mn"
  },

  // ENGLISH QUOTES
  {
    id: "en-01",
    text: "The only way to do great work is to love what you do. If you have not found it yet, keep looking. Do not settle.",
    source: "Steve Jobs",
    difficulty: "Easy",
    language: "en"
  },
  {
    id: "en-02",
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts in the grand scheme of life.",
    source: "Winston Churchill",
    difficulty: "Medium",
    language: "en"
  },
  {
    id: "en-03",
    text: "In the middle of difficulty lies opportunity. Keep your focus high, react with precision, and never look back at your past errors.",
    source: "Albert Einstein",
    difficulty: "Medium",
    language: "en"
  },
  {
    id: "en-04",
    text: "Programs must be written for people to read, and only incidentally for machines to execute in their silicon memory chips.",
    source: "Harold Abelson",
    difficulty: "Hard",
    language: "en"
  },
  {
    id: "en-05",
    text: "The greatest glory in living lies not in never falling, but in rising every time we fall to reach our absolute peak.",
    source: "Nelson Mandela",
    difficulty: "Medium",
    language: "en"
  },
  {
    id: "en-06",
    text: "Believe you can and you are halfway there. Every small action you take builds the momentum for your future triumphs.",
    source: "Theodore Roosevelt",
    difficulty: "Easy",
    language: "en"
  },
  {
    id: "en-07",
    text: "Code is like humor. When you have to explain it, it is bad. Write your systems simple, and always format with absolute clarity.",
    source: "Cory House",
    difficulty: "Hard",
    language: "en"
  }
];

export const BOT_NAMES = [
  "Туршлагатай Бичээч 🤖",
  "Гурван Настай Унага 🐎",
  "Галт Пуужин 🚀",
  "Залхуу Мэлхий 🐢",
  "Сүүлийн Үеийн AI 🧠",
  "Чамгүй Хурдан Хүлэг 🏎️"
];
