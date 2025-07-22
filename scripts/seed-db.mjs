import pkg from '../lib/seedDatabase.js';
const { seedDatabase } = pkg;

// Run the seed function
async function runSeed() {
  try {
    console.log('Starting database seed...');
    const result = await seedDatabase();
    
    if (result.success) {
      console.log('✅ Database seed completed successfully');
      process.exit(0);
    } else {
      console.error('❌ Database seed failed:', result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled error during seed:', error);
    process.exit(1);
  }
}

runSeed(); 