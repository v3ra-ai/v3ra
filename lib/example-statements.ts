export const exampleStatements = [
  // Science & Nature
  "Water boils at 100 degrees Celsius at sea level",
  "The speed of light in a vacuum is approximately 299,792 kilometers per second",
  "Diamonds are made of compressed carbon atoms",
  "The Earth completes one rotation on its axis in approximately 24 hours",
  "Mount Everest is the tallest mountain above sea level on Earth",
  "The human body contains 206 bones in adulthood",
  "Lightning is hotter than the surface of the sun",
  "Honey never spoils when stored properly",
  "The Great Barrier Reef is the largest living structure on Earth",
  "Saturn's rings are made primarily of ice particles",
  
  // Technology
  "The first iPhone was released in 2007",
  "Bitcoin was created by Satoshi Nakamoto in 2009",
  "The internet was originally called ARPANET",
  "Moore's Law states that transistor density doubles approximately every two years",
  "The first computer bug was an actual moth",
  "Email existed before the World Wide Web",
  "The QWERTY keyboard layout was designed to slow down typing",
  "GPS satellites orbit the Earth twice per day",
  "The first 1GB hard drive weighed over 500 pounds",
  "Bluetooth technology is named after a Viking king",
  
  // History
  "The Great Wall of China took over 2,000 years to build",
  "The pyramids of Giza were built around 2,500 BCE",
  "World War II ended in 1945",
  "The moon landing occurred on July 20, 1969",
  "The Roman Empire lasted for over 1,000 years",
  "The printing press was invented by Johannes Gutenberg in 1440",
  "The American Declaration of Independence was signed in 1776",
  "The Berlin Wall fell in 1989",
  "Leonardo da Vinci painted the Mona Lisa in the early 1500s",
  "The first Olympics were held in ancient Greece in 776 BCE",
  
  // Mathematics
  "Pi is an irrational number that starts with 3.14159",
  "There are infinitely many prime numbers",
  "Zero is neither positive nor negative",
  "The Fibonacci sequence appears frequently in nature",
  "A googol is the number 1 followed by 100 zeros",
  "The sum of angles in a triangle equals 180 degrees",
  "Euler's number (e) is approximately 2.71828",
  "The square root of 2 is an irrational number",
  "There are exactly 5 Platonic solids",
  "The golden ratio is approximately 1.618",
  
  // Geography
  "The Pacific Ocean is the largest ocean on Earth",
  "Antarctica is the driest continent on Earth",
  "The Amazon River is the longest river by volume",
  "Russia is the largest country by land area",
  "The Sahara Desert is roughly the size of the United States",
  "Iceland has more volcanoes than any other country in Europe",
  "Lake Baikal contains about 20% of Earth's fresh water",
  "The Dead Sea is the lowest point on Earth's surface",
  "Australia is the only country that is also a continent",
  "The Mariana Trench is the deepest part of the ocean",
  
  // Biology & Medicine
  "DNA stands for deoxyribonucleic acid",
  "Humans share approximately 98% of their DNA with chimpanzees",
  "The heart pumps about 5 liters of blood per minute",
  "Antibiotics cannot cure viral infections",
  "Plants produce oxygen through photosynthesis",
  "The human brain uses about 20% of the body's energy",
  "Blood type O negative is the universal donor",
  "Vaccines work by training the immune system",
  "Mitochondria are known as the powerhouse of the cell",
  "Adult humans have 32 teeth including wisdom teeth",
  
  // Physics & Chemistry
  "Water expands when it freezes",
  "Sound travels faster through water than through air",
  "Atoms are mostly empty space",
  "Energy cannot be created or destroyed",
  "The periodic table currently has 118 elements",
  "Helium is the second lightest element",
  "Black holes have gravity so strong that light cannot escape",
  "Mercury is the only metal that is liquid at room temperature",
  "The universe is approximately 13.8 billion years old",
  "Absolute zero is -273.15 degrees Celsius",
  
  // Economics & Business
  "Inflation reduces the purchasing power of money",
  "The stock market crash of 1929 triggered the Great Depression",
  "Supply and demand determine market prices",
  "The Federal Reserve controls U.S. monetary policy",
  "GDP stands for Gross Domestic Product",
  "Compound interest grows exponentially over time",
  "The gold standard was abandoned by most countries in the 20th century",
  "Market capitalization equals share price times shares outstanding",
  "The invisible hand is an economic concept by Adam Smith",
  "Monopolies can lead to market inefficiencies",
  
  // Space & Astronomy
  "The sun is a medium-sized star",
  "Jupiter is the largest planet in our solar system",
  "A day on Venus is longer than its year",
  "The Milky Way galaxy contains over 100 billion stars",
  "Light from the sun takes about 8 minutes to reach Earth",
  "Mars has two moons named Phobos and Deimos",
  "Saturn is less dense than water",
  "The asteroid belt lies between Mars and Jupiter",
  "Pluto was reclassified as a dwarf planet in 2006",
  "The observable universe is about 93 billion light-years in diameter"
];

export function getRandomStatement(): string {
  return exampleStatements[Math.floor(Math.random() * exampleStatements.length)];
}