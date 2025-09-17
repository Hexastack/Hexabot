# Manage NLU Entities

In Hexabot’s NLU engine, entities play a crucial role in extracting meaningful information from user inputs. Entities can be categorized into two types: **Trait Entities** and **Keyword Entities**. These entity types provide flexibility and depth in understanding user inputs, enabling Hexabot to process both high-level intentions and granular details.

### Trait Entities

Trait entities are inferred by analyzing the entire sentence or the overall context of the input. These entities represent high-level attributes or characteristics of the input and are not tied to specific words or phrases. Below some examples:

<table><thead><tr><th width="129">Entity</th><th width="185">Description</th><th width="192">Text</th><th>Value</th></tr></thead><tbody><tr><td>Intent</td><td>The purpose of the user’s input.</td><td>"<em>Hello</em>"</td><td>greeting</td></tr><tr><td>Intent</td><td>The purpose of the user’s input.</td><td>"<em>I want to book a flight</em>"</td><td>book_flight</td></tr><tr><td>Sentiment</td><td>The emotional tone behind the input.</td><td>"<em>I’m really frustrated with my current plan.</em>"</td><td>negative</td></tr><tr><td>Urgency</td><td>An attribute that determines the priority of the input.</td><td>"<em>I need help right away!</em>"</td><td>high</td></tr></tbody></table>

Trait entities allow Hexabot to grasp the overarching context of the input, providing a deeper understanding that informs appropriate responses and actions.

### Keyword Entities

Keyword entities are specific words or phrases extracted from the input to identify important attributes and convert unstructured data into structured information. These entities are tied to identifiable patterns or specific terms within the user input. Below some examples:

| Entity   | Description                                                               | Text                                            | Value     |
| -------- | ------------------------------------------------------------------------- | ----------------------------------------------- | --------- |
| Location | Identifying places from the input.                                        | "_I want to book a flight to **Paris**."_       | Paris     |
| Product  | Recognizing product names or types.                                       | "_I’m interested in buying the **iPhone 15**."_ | iPhone 15 |
| Topic    | Detecting specific keywords that activate certain workflows or responses. | "_Show me the latest **offers**."_              | offers    |

### Manage NLU Entities

Hexabot provides an intuitive interface to manage NLU entities efficiently, allowing you to create, update, and administer both Trait and Keyword entities. Follow these steps to manage NLU entities:

1. **Navigate to the NLU Section**

* Open the main menu and select the “NLU” option.
* Click on the “NLU Entities” tab.

2. **View the Entities List**

* A data grid will display all the existing entities, including both Trait and Keyword entities.
* Use the search bar to find specific entities or navigate through the list using pagination.

3. **Add New Entities**

* Click on the ”**+ Add**” button to create a new entity.
* Choose the type of entity by selecting the **Lookup Strategy**: **Trait** or **Keyword**.
* Fill in the required fields:
  * **Name**: The unique identifier for the entity.
  * **Description**: A brief explanation of the entity’s purpose.
  * Click **Save** to add the entity to the list.

4. **Update or Delete Entities**

* Locate the entity you want to modify.
* Click on the Edit icon to update its details or the Delete icon to remove the entity permanently.

5. **Administer Entity Values**

* For each entity, you can manage its possible values by clicking on the “**Values**” icon.

### Managing Entity Values

Once you click the “**Values**” icon, a new data grid will display the possible values associated with the selected entity.

1. **Guidelines for Values:**

* Use lowercase text and separate words with underscores (e.g., high\_priority, low\_stock).
* Ensure that values are descriptive and concise.

2. **Update or Remove Values:**

* Click the Edit icon to update an existing value or its synonyms.
* Use the Delete icon to remove a value permanently.

This flexible management system ensures Hexabot’s NLU remains robust, adaptable, and capable of handling a wide range of conversational scenarios.

### Bulk Import of NLU Entities and Values

Hexabot provides a bulk import feature that allows you to import NLU training data from CSV files, automatically creating entities and values as needed. This feature streamlines the process of populating your NLU system with large datasets.

#### To access the bulk Import feature navigate to the NLU management view:

1. Open the main side menu and select the "NLU" Page.
2. Go to the "NLP Samples" tab.
3. Look for the "Import" button in the action buttons area.

{% include "../../.gitbook/includes/nlu-samples-tab.md" %}

#### CSV File Format

The CSV file must follow a specific format with the following columns:

* **text** (required): The training text or user input sample
* **intent** (required): The primary intent or entity name
* **language** (required): The language code (e.g., "en", "fr", "es")

Additional columns can be added for other entities, where the column header becomes the entity name and the cell values become the entity values.

#### Example CSV Format

```csv
text,intent,language,destination,time
"Hello, I want to book a flight tomorrow to Paris.",book_flight,en,Paris,tomorrow
"I need a taxi to downtown now",book_taxi,en,downtown,now,
```

#### How the Import Process Works

1. **NLU Entity Creation**: If an entity mentioned in the CSV doesn't exist, Hexabot automatically creates it with the "trait" lookup strategy.
2. **NLU Value Creation**: For each unique value in an entity column, Hexabot creates the corresponding entity value if it doesn't already exist.
3. **NLU Sample Creation**: Each row becomes a new NLU sample.  If a NLU sample with identical text already exists, it will be skipped to avoid duplicates.

#### Sample Dataset

For quick setup and testing, you can use our published small talk dataset available on HuggingFace. This dataset contains basic small talk intents in both French and English languages, providing a ready-to-use starting point for your chatbot's conversational capabilities.

**Dataset:** [Hexastack/hexabot-smalltalk](https://huggingface.co/datasets/Hexastack/hexabot-smalltalk)

The dataset includes common conversational intents such as greetings, farewells, expressions of gratitude, and general inquiries. You can download the CSV files directly from HuggingFace and import them using the bulk import feature described above.\
