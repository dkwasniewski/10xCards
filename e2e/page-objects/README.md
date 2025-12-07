# Page Object Model (POM) Documentation

This directory contains Page Object Model classes following Playwright best practices for maintainable E2E tests.

## Structure

```
page-objects/
├── BasePage.ts                    # Base class with common functionality
├── LoginPage.ts                   # Login page
├── MyFlashcardsPage.ts           # My Flashcards page (main container)
├── GeneratePage.ts               # Generate & Review page
├── components/                    # Reusable component objects
│   ├── Header.ts                 # Application header/navigation
│   ├── FlashcardEditorDialog.ts  # Create/Edit flashcard dialog
│   ├── FlashcardsList.ts         # Flashcards list container
│   ├── FlashcardRow.ts           # Individual flashcard row
│   ├── GenerationForm.ts         # Flashcard generation form
│   ├── CandidatesList.ts         # Candidates list container
│   └── CandidateRow.ts           # Individual candidate row
└── index.ts                       # Central export point
```

## Design Principles

### 1. **Resilient Locators**

- Use `data-testid` attributes for key interactive elements
- Fallback to role-based and label-based locators
- Avoid brittle CSS selectors and XPath

### 2. **Composition Over Inheritance**

- Pages contain component objects
- Components are reusable across pages
- Clear separation of concerns

### 3. **Encapsulation**

- All locators are readonly properties
- Methods provide high-level actions
- Internal implementation details are hidden

### 4. **Async/Await**

- All methods are async for consistency
- Proper waiting strategies built-in
- No arbitrary timeouts in test code

## Usage Examples

### Basic Page Navigation

```typescript
import { LoginPage, MyFlashcardsPage } from "../page-objects";

test("navigate to flashcards", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const flashcardsPage = new MyFlashcardsPage(page);

  await loginPage.goto();
  await loginPage.login("test@test.com", "password");
  await flashcardsPage.goto();
  await flashcardsPage.waitForPageLoad();
});
```

### Working with Components

```typescript
test("create flashcard", async ({ page }) => {
  const flashcardsPage = new MyFlashcardsPage(page);

  await flashcardsPage.goto();
  await flashcardsPage.clickNewFlashcard();

  // Use the dialog component
  await flashcardsPage.editorDialog.fillFront("Question?");
  await flashcardsPage.editorDialog.fillBack("Answer!");
  await flashcardsPage.editorDialog.clickSubmit();
  await flashcardsPage.editorDialog.waitForDialogClose();

  // Verify in the list
  const firstRow = flashcardsPage.flashcardsList.getFirstRow();
  await expect(firstRow.frontText).toContainText("Question?");
});
```

### Accessing Individual Rows

```typescript
test("interact with flashcard row", async ({ page }) => {
  const flashcardsPage = new MyFlashcardsPage(page);
  await flashcardsPage.goto();

  // Get first row
  const firstRow = flashcardsPage.flashcardsList.getFirstRow();

  // Get row by index
  const secondRow = flashcardsPage.flashcardsList.getRowByIndex(1);

  // Get row by ID
  const specificRow = flashcardsPage.flashcardsList.getRowById("abc-123");

  // Interact with row
  await firstRow.select();
  await firstRow.clickEdit();

  // Get row data
  const data = await firstRow.getData();
  console.log(data); // { id, front, back, source, isSelected }
});
```

### Using Header Component

```typescript
test("navigate via header", async ({ page }) => {
  const flashcardsPage = new MyFlashcardsPage(page);

  // Header is available on any page
  const header = new Header(page);

  await header.goToMyFlashcards();
  await header.openUserMenu();
  await header.logout();
});
```

## Key Classes

### GeneratePage

Main page object for the Generate & Review page. See [GENERATE_PAGE_README.md](./GENERATE_PAGE_README.md) for detailed documentation.

**Key Methods:**

- `goto()` - Navigate to the page
- `waitForPageLoad()` - Wait for page to fully load
- `generateFlashcards(text, modelId)` - Generate flashcards from text
- `hasNewCandidates()` - Check if new candidates exist
- `acceptAllNewCandidates()` - Accept all generated candidates

**Components:**

- `generationForm` - GenerationForm component
- `pendingCandidatesList` - CandidatesList component (pending)
- `newCandidatesList` - CandidatesList component (new)
- `header` - Header component

### MyFlashcardsPage

Main page object for the flashcards management page.

**Key Methods:**

- `goto()` - Navigate to the page
- `waitForPageLoad()` - Wait for page to fully load
- `clickNewFlashcard()` - Open create dialog
- `search(query)` - Search flashcards

**Components:**

- `flashcardsList` - FlashcardsList component
- `editorDialog` - FlashcardEditorDialog component

### FlashcardEditorDialog

Handles both create and edit flashcard dialogs.

**Key Methods:**

- `fillFront(text)` - Fill front field
- `fillBack(text)` - Fill back field
- `fillFlashcard(front, back)` - Fill both fields
- `clickSubmit()` - Submit the form
- `waitForDialogClose()` - Wait for dialog to close
- `createFlashcard(front, back)` - Complete create flow

### FlashcardsList

Container for the list of flashcards.

**Key Methods:**

- `getRowCount()` - Get number of rows
- `getFirstRow()` - Get first row (most recent)
- `getRowByIndex(index)` - Get row by position
- `getRowById(id)` - Get row by flashcard ID
- `findRowByFrontText(text)` - Search for row
- `waitForNewFlashcard(text)` - Wait for new card

### FlashcardRow

Individual flashcard row with actions.

**Key Methods:**

- `getFrontText()` - Get front text
- `getBackText()` - Get back text
- `select()` / `deselect()` - Toggle selection
- `clickEdit()` - Open edit dialog
- `clickDelete()` - Open delete confirmation
- `getData()` - Get all row data

### Header

Application header with navigation.

**Key Methods:**

- `goToMyFlashcards()` - Navigate to flashcards
- `goToGenerate()` - Navigate to generate
- `openUserMenu()` - Open user dropdown
- `logout()` - Logout user

### GenerationForm

Form component for generating flashcards from text.

**Key Methods:**

- `fillSourceText(text)` - Fill source text input
- `selectModel(modelId)` - Select AI model
- `clickGenerate()` - Submit form
- `waitForGenerationComplete()` - Wait for generation
- `isReadyToGenerate()` - Check if form is valid

### CandidatesList

Container for candidate flashcards list.

**Key Methods:**

- `getRowCount()` - Get number of candidates
- `getFirstRow()` - Get first candidate
- `getRowByIndex(index)` - Get candidate by position
- `findRowByFrontText(text)` - Search for candidate
- `waitForCandidates(minCount)` - Wait for candidates to appear
- `selectAll()` / `deselectAll()` - Toggle all selections

### CandidateRow

Individual candidate row with actions.

**Key Methods:**

- `getFrontText()` - Get front text
- `getBackText()` - Get back text
- `select()` / `deselect()` - Toggle selection
- `accept()` - Accept candidate
- `edit()` - Edit candidate
- `reject()` - Reject candidate

## Best Practices

### ✅ DO

- Use page objects for all page interactions
- Chain methods for readable test flows
- Use component objects for reusable UI parts
- Wait for elements using built-in methods
- Use descriptive method names

### ❌ DON'T

- Access `page` directly in tests (use POM methods)
- Use arbitrary `waitForTimeout()` in tests
- Duplicate locators across test files
- Test implementation details
- Use brittle selectors

## Testing the POMs

Run the example test:

```bash
npm run test:e2e -- flashcards/create-flashcard.spec.ts
```

Run in UI mode for debugging:

```bash
npm run test:e2e:ui
```

## Adding New Page Objects

1. Create new class extending `BasePage`
2. Define locators as readonly properties
3. Add high-level action methods
4. Export from `index.ts`
5. Write tests using the new POM

Example:

```typescript
import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class GeneratePage extends BasePage {
  readonly textInput: Locator;
  readonly generateButton: Locator;

  constructor(page: Page) {
    super(page);
    this.textInput = page.getByTestId("text-input");
    this.generateButton = page.getByTestId("generate-button");
  }

  async goto() {
    await super.goto("/generate");
  }

  async generateFlashcards(text: string) {
    await this.textInput.fill(text);
    await this.generateButton.click();
  }
}
```
