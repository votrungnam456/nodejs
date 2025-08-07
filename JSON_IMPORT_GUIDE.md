# JSON Import Tool Guide

## Overview

The JSON Import Tool allows you to upload and process JSON files without requiring any API calls. It's a client-side tool that provides file validation, data preview, and import simulation.

## Features

### 🎯 Core Features

- **Drag & Drop Upload**: Simply drag and drop JSON files onto the upload area
- **File Validation**: Automatic validation of file type and size (max 10MB)
- **JSON Preview**: View the contents of your JSON file before importing
- **Data Type Detection**: Automatically detects if your data contains products, users, or other structures
- **Import Simulation**: Simulates the import process with realistic results
- **Error Handling**: Comprehensive error messages and validation

### 📁 Supported File Types

- `.json` files
- JSON content with proper formatting
- Maximum file size: 10MB

### 🔧 Import Options

#### Data Type

- **Auto Detect**: Automatically determines the data structure
- **Products**: For product catalog data
- **Users**: For user account data
- **Custom**: For any other JSON structure

#### Import Mode

- **Append**: Add new items to existing data
- **Replace**: Clear existing data and import new items
- **Update**: Merge with existing data, updating duplicates

#### Validation Options

- **Validate Data Structure**: Ensures JSON format is correct
- **Skip Duplicates**: Prevents duplicate entries during import

## How to Use

### Step 1: Access the Import Tool

1. Navigate to the homepage
2. Click on "Import JSON" in the navigation menu
3. Or directly visit `/import`

### Step 2: Upload Your JSON File

1. **Drag & Drop**: Drag your JSON file directly onto the upload area
2. **Click to Browse**: Click "Choose File" to select a JSON file from your computer
3. The tool will automatically validate the file and show a preview

### Step 3: Configure Import Options

1. **Data Type**: Select the appropriate data type or leave as "Auto Detect"
2. **Import Mode**: Choose how you want to handle existing data
3. **Validation**: Enable/disable validation options as needed

### Step 4: Preview or Import

1. **Preview Import**: Click "Preview Import" to see what will be imported
2. **Import Data**: Click "Import Data" to simulate the import process
3. **Clear All**: Use "Clear All" to reset the form and start over

## Sample Data

A sample JSON file (`sample-data.json`) is provided in the project root with the following structure:

```json
{
  "products": [
    {
      "id": "prod_001",
      "name": "Wireless Bluetooth Headphones",
      "description": "High-quality wireless headphones...",
      "price": 129.99,
      "category": "Electronics",
      "rating": 4.5,
      "reviews": 234,
      "stock": 45
    }
  ],
  "users": [
    {
      "id": "user_001",
      "username": "john_doe",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  ],
  "categories": [
    {
      "id": "cat_001",
      "name": "Electronics",
      "description": "Latest electronic devices and gadgets"
    }
  ]
}
```

## Understanding Results

### Import Results

- **Total Items**: Number of items in the JSON file
- **Processed**: Successfully processed items
- **Skipped**: Items that were skipped (duplicates, invalid data)
- **Data Type**: Detected data structure type
- **Import Mode**: How the data was imported
- **Errors/Warnings**: Any issues encountered during import

### Preview Results

- **Data Type**: Detected structure type
- **Structure**: Array or object format
- **Estimated Items**: Number of items to be imported
- **Sample Data**: Preview of the actual data
- **Warnings**: Any potential issues with the data

## Error Handling

### Common Errors

1. **Invalid File Type**: Only JSON files are supported
2. **File Too Large**: Maximum file size is 10MB
3. **Invalid JSON**: Malformed JSON will be rejected
4. **Empty Data**: JSON arrays or objects cannot be empty

### Error Messages

- Clear, descriptive error messages
- Suggestions for fixing common issues
- Modal dialogs for important errors

## Technical Details

### Client-Side Processing

- All processing happens in the browser
- No server-side API calls required
- File reading and validation done locally
- Import simulation for demonstration

### Browser Compatibility

- Modern browsers with ES6+ support
- FileReader API for file processing
- Drag and Drop API for file uploads

### Security Features

- File type validation
- File size limits
- JSON structure validation
- No data sent to external servers

## Tips for Best Results

1. **Use Valid JSON**: Ensure your JSON is properly formatted
2. **Reasonable File Size**: Keep files under 10MB for best performance
3. **Consistent Structure**: Use consistent data structure within your JSON
4. **Test with Sample Data**: Try the provided sample file first
5. **Preview Before Import**: Always preview your data before importing

## Troubleshooting

### File Won't Upload

- Check file extension is `.json`
- Ensure file size is under 10MB
- Verify JSON is properly formatted

### Preview Not Working

- Check browser console for errors
- Ensure JSON structure is valid
- Try with the sample data first

### Import Fails

- Review error messages carefully
- Check JSON structure matches expected format
- Verify all required fields are present

## Support

For issues or questions:

1. Check the browser console for error messages
2. Verify your JSON format using online JSON validators
3. Try with the provided sample data first
4. Ensure you're using a modern browser

---

**Note**: This is a demonstration tool that simulates import functionality. No actual data is stored or processed on the server.
