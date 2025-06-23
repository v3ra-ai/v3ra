/**
 * Simple script to fix the 'gpt-40' model name issue in the database
 * 
 * Run with: npx ts-node scripts/fix-gpt-40-modelname.ts
 */

async function fixGpt40ModelName() {
  try {
    console.log("Fixing 'gpt-40' model names in the database...");
    
    const response = await fetch('http://localhost:3000/api/validators/update-model-name', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        oldModelName: 'gpt-40',
        newModelName: 'gpt-4o'
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Success: ${result.message}`);
    } else {
      console.error(`❌ Error: ${result.error}`);
    }
  } catch (error) {
    console.error("Failed to update model names:", error);
  }
}

// Execute the function
fixGpt40ModelName();
