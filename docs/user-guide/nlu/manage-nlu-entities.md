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
