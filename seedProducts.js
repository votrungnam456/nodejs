const connectDB = require("./connectDB.js");
const Product = require("./model/product.js");

const sampleProducts = [
  {
    name: "iPhone 15 Pro",
    description:
      "The latest iPhone with A17 Pro chip, titanium design, and advanced camera system. Features 48MP main camera, 3x telephoto lens, and USB-C connectivity.",
    price: 999.99,
    category: "Electronics",
    stock: 50,
    rating: 4.8,
    reviews: 1250,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
  },
  {
    name: "MacBook Air M2",
    description:
      "Ultra-thin laptop with Apple M2 chip, 13.6-inch Liquid Retina display, and up to 18 hours of battery life. Perfect for productivity and creativity.",
    price: 1199.99,
    category: "Electronics",
    stock: 30,
    rating: 4.9,
    reviews: 890,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
  },
  {
    name: "Nike Air Max 270",
    description:
      "Comfortable running shoes with Air Max 270 unit for maximum cushioning. Breathable mesh upper and durable rubber outsole for everyday wear.",
    price: 150.0,
    category: "Clothing",
    stock: 75,
    rating: 4.6,
    reviews: 320,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
  },
  {
    name: "The Great Gatsby",
    description:
      "F. Scott Fitzgerald's masterpiece about the Jazz Age. A story of decadence and excess, exploring themes of the American Dream and social class.",
    price: 12.99,
    category: "Books",
    stock: 200,
    rating: 4.7,
    reviews: 2150,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
  },
  {
    name: "Philips Hue Smart Bulb",
    description:
      "Smart LED bulb with 16 million colors, voice control compatibility, and energy efficiency. Control your lighting from anywhere with the Hue app.",
    price: 49.99,
    category: "Home & Garden",
    stock: 100,
    rating: 4.5,
    reviews: 567,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400",
  },
  {
    name: "Yoga Mat Premium",
    description:
      "Non-slip yoga mat made from eco-friendly TPE material. Perfect thickness for comfort and stability during yoga, pilates, and fitness workouts.",
    price: 29.99,
    category: "Sports",
    stock: 150,
    rating: 4.4,
    reviews: 234,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
  },
  {
    name: "L'Oreal Paris Foundation",
    description:
      "Long-lasting foundation with SPF 25 protection. Provides full coverage with a natural finish. Available in 40+ shades for all skin tones.",
    price: 24.99,
    category: "Beauty",
    stock: 80,
    rating: 4.3,
    reviews: 445,
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400",
  },
  {
    name: "Organic Green Tea",
    description:
      "Premium organic green tea leaves from Japan. Rich in antioxidants and natural flavor. Perfect for daily wellness and relaxation.",
    price: 15.99,
    category: "Food",
    stock: 300,
    rating: 4.6,
    reviews: 178,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
  },
  {
    name: "Sony WH-1000XM4 Headphones",
    description:
      "Industry-leading noise canceling wireless headphones with 30-hour battery life. Premium sound quality with touch controls and voice assistant support.",
    price: 349.99,
    category: "Electronics",
    stock: 25,
    rating: 4.8,
    reviews: 1200,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
  },
  {
    name: "Levi's 501 Original Jeans",
    description:
      "Classic straight-leg jeans with button fly. Made from premium denim with perfect fit and timeless style. Available in multiple washes.",
    price: 89.99,
    category: "Clothing",
    stock: 120,
    rating: 4.5,
    reviews: 890,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
  },
  {
    name: "The Hobbit",
    description:
      "J.R.R. Tolkien's beloved fantasy novel about Bilbo Baggins' journey with thirteen dwarves. A prelude to The Lord of the Rings trilogy.",
    price: 14.99,
    category: "Books",
    stock: 180,
    rating: 4.8,
    reviews: 1560,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
  },
  {
    name: "KitchenAid Stand Mixer",
    description:
      "Professional 5-quart stand mixer with 10 speeds and planetary mixing action. Perfect for baking, mixing, and food preparation.",
    price: 379.99,
    category: "Home & Garden",
    stock: 40,
    rating: 4.9,
    reviews: 678,
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
  },
  {
    name: "Adidas Ultraboost 21",
    description:
      "Revolutionary running shoes with responsive Boost midsole and Primeknit upper. Designed for maximum energy return and comfort.",
    price: 180.0,
    category: "Sports",
    stock: 60,
    rating: 4.7,
    reviews: 456,
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400",
  },
  {
    name: "Clinique Moisture Surge",
    description:
      "Intense 72-hour moisture cream with hyaluronic acid. Provides long-lasting hydration for all skin types, including sensitive skin.",
    price: 39.99,
    category: "Beauty",
    stock: 95,
    rating: 4.4,
    reviews: 334,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
  },
  {
    name: "Starbucks Coffee Beans",
    description:
      "Premium Arabica coffee beans with rich, bold flavor. Medium roast with notes of chocolate and caramel. Perfect for home brewing.",
    price: 19.99,
    category: "Food",
    stock: 250,
    rating: 4.5,
    reviews: 289,
    image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400",
  },
];

async function seedProducts() {
  try {
    // Connect to database
    await connectDB.connectDB();
    console.log("Database connected successfully");

    // Clear existing products
    await Product.deleteMany({});
    console.log("Cleared existing products");

    // Insert sample products
    const insertedProducts = await Product.insertMany(sampleProducts);
    console.log(`Successfully inserted ${insertedProducts.length} products`);

    // Display some statistics
    const totalProducts = await Product.countDocuments();
    const categories = await Product.distinct("category");

    console.log("\nDatabase Statistics:");
    console.log(`Total products: ${totalProducts}`);
    console.log(`Categories: ${categories.join(", ")}`);

    console.log("\nSample products added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding products:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedProducts();
