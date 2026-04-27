# AI Recommendation System - Backend Architecture Deep Dive

## Overview
The backend implements a **k-Nearest Neighbors (k-NN) machine learning algorithm** to find and recommend similar travel itineraries based on user preferences.

---

## Backend Architecture

### **High-Level Flow**
```
User Search Request
        ↓
[Validation & Feature Extraction]
        ↓
[Normalize Query Features]
        ↓
[Apply k-NN Algorithm]
        ↓
[Calculate Similarity Scores]
        ↓
[Rank & Sort Results]
        ↓
[Return Top Recommendations]
```

---

## Core Components

### **1. REST API Layer** (Controller)
**File:** `RecommendationController.java`

**Endpoints:**

#### POST `/api/itinerary/recommendations/search`
- Receives search criteria from frontend
- Validates input parameters
- Calls service layer
- Returns ranked recommendations

**Request:**
```json
{
  "maxBudget": 5000,
  "location": "Sousse",
  "limit": 5,
  "minDuration": 3,
  "maxDuration": 14,
  "kNeighbors": 5,
  "minRating": 3.5,
  "exactLocationMatch": false
}
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "recommendations": [
    {
      "itineraryId": "uuid",
      "title": "Sousse Summer Escape",
      "budget": 4500,
      "durationDays": 5,
      "similarityScore": 0.92,
      "rating": 4.5,
      ...
    }
  ]
}
```

#### GET `/api/itinerary/recommendations/similar/{itineraryId}?limit=5`
- Gets itinerary details
- Treats it as a query point
- Finds k-nearest neighbors (similar itineraries)
- Returns ranked similar trips

#### POST `/api/itinerary/recommendations/train/generate`
- Generates training data from existing itineraries
- Creates feature vectors for the ML model
- Stores normalized data in database

#### POST `/api/itinerary/recommendations/train/normalize`
- Normalizes training data (0-1 scale)
- Ensures all features contribute equally
- Improves k-NN accuracy

#### GET `/api/itinerary/recommendations/train/statistics`
- Returns ML model statistics
- Shows data distribution
- Displays quality metrics

#### GET `/api/itinerary/recommendations/train/export`
- Exports training data as CSV
- For analysis and debugging
- Contains all feature vectors

---

### **2. Service Layer** (Business Logic)
**File:** `RecommendationService.java`

**Key Methods:**

#### `searchRecommendations(RecommendationSearchRequest criteria)`
1. **Validation**: Checks parameter ranges
2. **Feature Extraction**: Converts criteria to feature vector
3. **Query Building**: Creates SQL query for initial filtering
4. **k-NN Calculation**: Applies algorithm
5. **Ranking**: Sorts by similarity score
6. **Result Mapping**: Converts to DTOs

**Pseudocode:**
```java
public List<Recommendation> searchRecommendations(RecommendationSearchRequest criteria) {
    // Step 1: Validate
    validateCriteria(criteria);
    
    // Step 2: Get candidate itineraries from database
    List<ItineraryTrainingData> candidates = 
        findCandidates(criteria.getMaxBudget(), 
                      criteria.getLocation(),
                      criteria.getMinDuration(),
                      criteria.getMaxDuration());
    
    // Step 3: Create query feature vector
    double[] queryVector = extractFeatures(criteria);
    
    // Step 4: Calculate distances
    List<SimilarityScore> scores = new ArrayList<>();
    for (ItineraryTrainingData candidate : candidates) {
        double[] candidateVector = candidate.getFeatures();
        double distance = calculateEuclideanDistance(queryVector, candidateVector);
        double similarity = 1.0 / (1.0 + distance); // Convert to similarity
        scores.add(new SimilarityScore(candidate, similarity));
    }
    
    // Step 5: Sort and get top k
    scores.sort(Comparator.comparingDouble(SimilarityScore::getScore).reversed());
    List<Recommendation> results = scores
        .stream()
        .limit(criteria.getLimit())
        .map(this::toRecommendation)
        .collect(Collectors.toList());
    
    return results;
}
```

#### `getSimilarRecommendations(String itineraryId, int limit)`
1. Fetches the target itinerary
2. Extracts its features
3. Treats it as a query
4. Finds k-nearest neighbors
5. Excludes the query itinerary itself

#### `generateTrainingData()`
1. Queries all itineraries from database
2. Extracts numerical features from each
3. Stores in `ItineraryTrainingData` table
4. Marks as "unnormalized"

#### `normalizeTrainingData()`
1. Gets min/max for each feature
2. Normalizes using formula: `(value - min) / (max - min)`
3. Updates training data records
4. Marks as "normalized"

---

### **3. Machine Learning Algorithm** (k-Nearest Neighbors)

#### **What is k-NN?**
- Simple, effective algorithm for similarity search
- Works by finding the k closest points in feature space
- Distance metric: Euclidean distance

#### **Distance Calculation**
```
Distance = √[(x₁-y₁)² + (x₂-y₂)² + ... + (xₙ-yₙ)²]
```

Where:
- x₁, x₂, ... = Query feature values
- y₁, y₂, ... = Candidate feature values
- n = Number of features

#### **Features Used**
1. **Budget** (TND)
2. **Duration** (days)
3. **Average Daily Cost** (TND/day)
4. **Rating** (0-5)
5. **Number of Activities/Steps**
6. **Number of Collaborators**
7. **Number of Expenses**
8. **Location Similarity** (encoded as number)

#### **Why Euclidean Distance?**
- Fast to compute
- Intuitive (measures straight-line distance)
- Works well for normalized features
- Standard for feature-based similarity

---

### **4. Data Model Layer** (Database)

#### **ItineraryTrainingData Entity**
```java
@Entity
@Table(name = "itinerary_training_data")
public class ItineraryTrainingData {
    
    @Id
    private String itineraryId;
    
    // Features (extracted from Itinerary)
    private Double budget;
    private Integer durationDays;
    private Double avgDailyCost;
    private Double rating;
    private Integer numSteps;
    private Integer numCollaborators;
    private Integer numExpenses;
    private String location;
    
    // Normalized Features (0-1 scale)
    private Double normalizedBudget;
    private Double normalizedDuration;
    private Double normalizedAvgCost;
    private Double normalizedRating;
    private Double normalizedSteps;
    private Double normalizedCollaborators;
    
    // Metadata
    private LocalDateTime trainingDataCreatedAt;
    private LocalDateTime trainingDataUpdatedAt;
    private Boolean isNormalized;
    
    // Reference to actual itinerary
    @OneToOne
    @JoinColumn(name = "itinerary_id")
    private Itinerary itinerary;
}
```

#### **How Data Flows**
```
1. User creates an itinerary
   ↓
2. Itinerary saved to 'itinerary' table
   ↓
3. (Admin) Runs "Generate Training Data"
   ↓
4. Features extracted to 'itinerary_training_data'
   ↓
5. (Admin) Runs "Normalize Training Data"
   ↓
6. Normalized values calculated and stored
   ↓
7. k-NN searches use normalized values
```

---

### **5. Feature Extraction** (Why Each Feature?)

| Feature | Range | Purpose | Weight |
|---------|-------|---------|--------|
| Budget | 0-50000 | Cost matching | High |
| Duration | 1-365 | Trip length matching | High |
| Avg Daily Cost | 0-10000 | Spending pattern | High |
| Rating | 0-5 | Quality indicator | Medium |
| Num Steps | 1-100 | Activity density | Medium |
| Collaborators | 1-50 | Group size | Low |
| Expenses | 0-200 | Financial complexity | Low |
| Location | Encoded | Geographic match | High |

**Example Feature Vector:**
```
Query: Budget=5000, Duration=5, Location=Sousse
Feature Vector: [5000, 5, 1000, 0, 8, 3, 15, 2.5]
                   ↑    ↑   ↑     ↑ ↑ ↑ ↑  ↑
                  Budget|Dur| AvgCost|Rating|Steps|Collab|Exp|LocEncoded
```

---

### **6. Normalization** (Why It Matters)

**Before Normalization (Raw Values):**
```
Query:     [5000,   5,  1000,  4.5,  8,  3, 15]
Candidate: [4500,   6,   900,  4.0,  7,  3, 14]

Distance = √[(5000-4500)² + (5-6)² + (1000-900)² + ...]
         = √[500² + 1² + 100² + ...]  // Budget dominates!
```

**After Normalization (0-1 scale):**
```
Min Budget = 500,  Max Budget = 50000
Min Dur = 1,       Max Dur = 30
Min Rating = 0,    Max Rating = 5

Query:     [0.09,  0.13,  0.20,  0.90,  0.26,  0.06, 0.07]
Candidate: [0.08,  0.17,  0.18,  0.80,  0.23,  0.06, 0.07]

Distance = √[(0.09-0.08)² + (0.13-0.17)² + ...]  // Balanced!
```

**Why Normalize?**
- Budget values (5000) dwarf duration values (5)
- Without normalization, budget alone dominates
- After normalization, all features contribute equally

---

### **7. Similarity Score Calculation**

**Formula:**
```
Similarity = 1 / (1 + Distance)
```

**Examples:**
```
Distance = 0.1  → Similarity = 1 / 1.1 = 0.909 (Excellent match!)
Distance = 0.3  → Similarity = 1 / 1.3 = 0.769 (Good match)
Distance = 0.5  → Similarity = 1 / 1.5 = 0.667 (Fair match)
Distance = 1.0  → Similarity = 1 / 2.0 = 0.500 (Low match)
Distance = 2.0  → Similarity = 1 / 3.0 = 0.333 (Poor match)
```

**Why this formula?**
- Inverse relationship (smaller distance = higher similarity)
- Bounded between 0-1 (easy to understand as percentage)
- Non-linear (penalizes large distances more)

---

### **8. Filtering & Optimization**

**SQL Filtering (Pre-k-NN):**
```sql
SELECT * FROM itinerary_training_data
WHERE budget <= ? 
  AND duration BETWEEN ? AND ?
  AND rating >= ?
  AND (location = ? OR location LIKE ?)
  AND is_active = true;
```

**Benefits:**
- Reduces candidate set before expensive distance calculations
- Improves performance on large datasets
- Ensures only relevant results are considered

---

### **9. Complete Search Flow**

```
┌─────────────────────────────────────────────────────────┐
│ Frontend sends search request                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ RecommendationController.search()                       │
│ - Validates input                                       │
│ - Calls service                                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ RecommendationService.searchRecommendations()           │
│ 1. Extract features from criteria                       │
│ 2. Query database for candidates                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ k-NN Algorithm (in service)                             │
│ 1. For each candidate:                                  │
│    - Get normalized feature vector                      │
│    - Calculate Euclidean distance                       │
│    - Convert to similarity score (0-1)                  │
│ 2. Sort by similarity (descending)                      │
│ 3. Take top 'limit' results                             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ ItineraryRepository (fetch full details)                │
│ - Get titles, descriptions, dates                       │
│ - Get user ratings, reviews                             │
│ - Get image URLs                                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Map to Response DTOs                                    │
│ - Add recommendation reasons                            │
│ - Format dates                                          │
│ - Add metadata                                          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Return JSON response to frontend                        │
│ [Array of recommendations with scores]                  │
└─────────────────────────────────────────────────────────┘
```

---

## Configuration Parameters

### **k Parameter**
- Default: 5 (find 5 nearest neighbors)
- Can be adjusted per request
- Higher k = more candidates but might include poor matches

### **Distance Threshold**
- Recommendations only returned if similarity > some threshold
- Prevents poor matches from appearing
- Can be configured

### **Feature Weights**
- Currently all features weighted equally after normalization
- Could be enhanced with weighted k-NN:
  ```
  distance = √[w₁(x₁-y₁)² + w₂(x₂-y₂)² + ...]
  ```

---

## Performance Considerations

### **Time Complexity**
- **Search**: O(n*m) where n = candidates, m = features
- **Indexing**: Could use KD-Tree for O(log n) but added complexity
- **Normalization**: O(n) one-time cost

### **Space Complexity**
- O(n*m) for storing training data vectors
- For 10,000 itineraries × 8 features = 80,000 values

### **Optimization Techniques**
1. **Lazy Normalization**: Only normalize when needed
2. **Caching**: Store pre-calculated normalized vectors
3. **Database Indexing**: Index frequently-filtered columns
4. **Pagination**: Limit results per page
5. **KD-Tree**: For very large datasets (>100k)

---

## Training Data Management

### **Step 1: Generate**
```java
public void generateTrainingData() {
    List<Itinerary> itineraries = itineraryRepository.findAll();
    
    for (Itinerary itin : itineraries) {
        ItineraryTrainingData trainingData = new ItineraryTrainingData();
        trainingData.setItineraryId(itin.getId());
        trainingData.setBudget(itin.getBudget());
        trainingData.setDurationDays(itin.getDurationDays());
        trainingData.setAvgDailyCost(calculateAvgDailyCost(itin));
        trainingData.setRating(itin.getAverageRating());
        trainingData.setNumSteps(itin.getSteps().size());
        trainingData.setNumCollaborators(itin.getCollaborators().size());
        trainingData.setNumExpenses(itin.getExpenses().size());
        trainingData.setLocation(itin.getLocation());
        trainingData.setIsNormalized(false);
        
        trainingDataRepository.save(trainingData);
    }
}
```

### **Step 2: Normalize**
```java
public void normalizeTrainingData() {
    List<ItineraryTrainingData> allData = trainingDataRepository.findAll();
    
    // Calculate min/max for each feature
    double minBudget = allData.stream().mapToDouble(d -> d.getBudget()).min().orElse(0);
    double maxBudget = allData.stream().mapToDouble(d -> d.getBudget()).max().orElse(1);
    
    // Normalize each record
    for (ItineraryTrainingData data : allData) {
        data.setNormalizedBudget((data.getBudget() - minBudget) / (maxBudget - minBudget));
        // ... repeat for other features
        data.setIsNormalized(true);
        trainingDataRepository.save(data);
    }
}
```

---

## Error Handling

### **Invalid Parameters**
```
Budget < 0 → 400 Bad Request
Duration > 365 → 400 Bad Request
Rating < 0 or > 5 → 400 Bad Request
```

### **No Results**
```json
{
  "success": true,
  "count": 0,
  "recommendations": [],
  "message": "No matching itineraries found"
}
```

### **Data Not Trained**
```json
{
  "success": false,
  "error": "Training data not available. Please run training first."
}
```

---

## Example: Complete Search

**User Input:**
```json
{
  "maxBudget": 5000,
  "location": "Sousse",
  "minDuration": 3,
  "maxDuration": 10,
  "limit": 3
}
```

**Processing:**
```
1. Extract features: [5000, 3-10 range, ..., "Sousse"]

2. Database query: WHERE budget ≤ 5000 AND duration BETWEEN 3 AND 10
   Returns: 450 candidates

3. k-NN calculation (top 3):
   Candidate A: distance=0.08  → similarity=0.926 (92.6% match)
   Candidate B: distance=0.15  → similarity=0.870 (87.0% match)
   Candidate C: distance=0.22  → similarity=0.820 (82.0% match)
   Candidate D: distance=0.31  → similarity=0.763 (76.3% match) - excluded (not top 3)

4. Fetch full details for A, B, C

5. Generate reason: "Highly relevant. Budget: 4500. Sousse location. 5 activities."

6. Return JSON with 3 recommendations
```

---

## Enhancements (Future)

1. **Weighted k-NN**: Different importance for features
2. **Content-Based Filtering**: Consider itinerary descriptions
3. **Collaborative Filtering**: Use user ratings/preferences
4. **Hybrid Approach**: Combine multiple algorithms
5. **Real-Time ML**: Update model as new data arrives
6. **Distance Metrics**: Try Manhattan, Cosine, Hamming distances
7. **Clustering**: K-Means to pre-segment itineraries
8. **Deep Learning**: Neural networks for feature extraction

---

## Summary

The AI recommendation system uses **k-Nearest Neighbors (k-NN)** to find similar travel itineraries:

1. **Feature Extraction**: 8 features from each itinerary
2. **Normalization**: Scale features to 0-1 range
3. **Distance Calculation**: Euclidean distance in feature space
4. **Ranking**: Sort by similarity score (inverted distance)
5. **Filtering**: Only return top k results

This approach is:
- ✅ Fast and efficient
- ✅ Explainable (easy to understand why)
- ✅ Scalable (works for thousands of items)
- ✅ Flexible (easy to add/modify features)
