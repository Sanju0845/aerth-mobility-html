# Aerth Mobility - Contact Form Setup Guide

## Overview
This guide explains how to configure the contact form to send enquiries to your Google Sheet.

## What You Need to Change

### Step 1: Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **"Blank"** to create a new spreadsheet
3. In the first row (Row 1), add these column headers:
   ```
   A1: Timestamp
   B1: Name
   C1: Phone
   D1: Email
   E1: Type
   F1: Message
   G1: Vehicle
   H1: Centre
   I1: City
   J1: Location
   ```
4. **File → Rename** to "Aerth Enquiries"

### Step 2: Add Apps Script

1. In your Google Sheet, click **Extensions → Apps Script**
2. Delete any default code in the editor
3. **Copy and paste this entire code:**

```javascript
function doPost(e) {
  try {
    // Parse the incoming form data
    var data = JSON.parse(e.postData.contents);
    
    // Get the active sheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Add the form data as a new row
    sheet.appendRow([
      new Date(),              // Timestamp (automatic)
      data.name || '',         // Name
      data.phone || '',        // Phone
      data.email || '',        // Email
      data.type || '',         // Enquiry Type
      data.message || '',      // Message
      data.vehicle || '',      // Vehicle Model
      data.centre || '',       // Service Centre
      data.city || '',         // City
      data.location || ''      // Location
    ]);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Log error and return error response
    console.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: For testing if the script is working
function doGet(e) {
  return ContentService.createTextOutput('Apps Script is working! Use POST to submit form data.')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

4. **Save** the script (Ctrl+S or click disk icon)

### Step 3: Deploy the Web App

1. Click **Deploy → New deployment**
2. Click the **gear icon** (⚙️) and select **"Web app"**
3. Configure deployment:
   - **Description**: "Aerth Contact Form Handler"
   - **Execute as**: Me
   - **Who has access**: **Anyone** (⚠️ Important!)
4. Click **Deploy**
5. **Authorize** the script if prompted (click through permissions)
6. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/XXXX/exec`)

### Step 4: Update Website Code

1. Open the file: `evx.js`
2. Find **line 958** (search for "Submit to Google Sheets")
3. Replace the URL with your copied URL:

```javascript
// OLD (developer's URL):
await fetch('https://script.google.com/macros/s/AKfycbynnPz0MDn5yHY8XbDa54p7RubZ32XOgBs9IAhduCrbt4nmoH2I1F0a_z3ZU6BukRzcdg/exec', {

// NEW (your URL):
await fetch('YOUR_COPIED_URL_HERE', {
```

4. **Save** the file

### Step 5: Test the Form

1. Open your website contact page
2. Fill out the form with test data
3. Click "Send Enquiry"
4. Check your Google Sheet - data should appear within 2-3 seconds!

---

## Troubleshooting

### Error 401 (Unauthorized)
- **Cause**: Deployment not set to "Anyone"
- **Fix**: Redeploy with "Who has access: Anyone"

### Error: Script function not found: doGet
- **Cause**: Wrong function name or code error
- **Fix**: Copy the exact code from Step 2

### Data not appearing in sheet
- Check browser console (F12) for errors
- Verify the URL is correctly copied
- Ensure sheet has headers in Row 1

### CORS Errors
- This is normal with `mode: 'no-cors'`
- Data still saves to your sheet

---

## How It Works

1. User fills contact form
2. Form data is sent to your Google Apps Script
3. Script adds data as a new row in your sheet
4. You see all enquiries in real-time

---

## Security Notes

- The Apps Script URL is public but hard to guess
- Only form data is stored (no passwords or sensitive info)
- Consider adding data validation if needed

---

## Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify all steps were followed exactly
3. Ensure Google Sheet is accessible

---

**Setup Time**: ~10 minutes  
**Skill Level**: Beginner (no coding required)
