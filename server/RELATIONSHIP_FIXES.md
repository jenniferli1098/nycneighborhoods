# MongoDB Model Relationship Fixes Required

## Issues Found and Recommended Fixes

### 1. **Fix Reference Types Across All Models**

#### Visit Model - Update to use ObjectId references:
```javascript
// Current (INCORRECT):
userId: { type: String, required: true, trim: true }
neighborhoodId: { type: String, trim: true }
countryId: { type: String, trim: true }

// Should be (CORRECT):
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
neighborhoodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Neighborhood' }
countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' }
```

#### Neighborhood Model - Update to use ObjectId references:
```javascript
// Current (INCORRECT):
boroughId: { type: String, trim: true }
cityId: { type: String, trim: true }

// Should be (CORRECT):
boroughId: { type: mongoose.Schema.Types.ObjectId, ref: 'Borough' }
cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' }
```

#### Borough Model - Update to use ObjectId and remove bidirectional relationship:
```javascript
// Current (PROBLEMATIC):
neighborhoodIds: [{ type: String, required: true, trim: true }]
city: { type: String, enum: ['NYC', 'Boston', 'Cambridge', 'Somerville'] }

// Should be (CORRECT):
cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true }
// Remove neighborhoodIds array - use inverse lookup instead
```

### 2. **Simplify Borough-Neighborhood Relationship**

**Current Problem**: Bidirectional relationship between Borough and Neighborhood
- Borough stores `neighborhoodIds` array
- Neighborhood stores `boroughId` reference

**Recommended Solution**: Use unidirectional relationship
- Remove `neighborhoodIds` from Borough
- Keep `boroughId` in Neighborhood
- Use inverse queries: `Neighborhood.find({ boroughId: borough._id })`

### 3. **Remove Legacy Fields**

#### Neighborhood Model:
```javascript
// Remove this legacy field:
city: { type: String, enum: ['NYC', 'Boston', 'Cambridge', 'Somerville'] }

// Keep only the new system:
categoryType: { type: String, required: true, enum: ['borough', 'city'] }
boroughId: { type: mongoose.Schema.Types.ObjectId, ref: 'Borough' }
cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' }
```

#### Borough Model:
```javascript
// Replace this:
city: { type: String, enum: ['NYC', 'Boston', 'Cambridge', 'Somerville'] }

// With proper City reference:
cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true }
```

### 4. **Update All Method References**

After changing to ObjectId references, update all methods that use `.toString()`:

```javascript
// Old methods using string comparison:
Neighborhood.find({ boroughId: this._id.toString() })

// New methods using ObjectId:
Neighborhood.find({ boroughId: this._id })
```

### 5. **Recommended Final Schema Structure**

```
User (ObjectId)
├── Visit (many)
    ├── userId: ObjectId -> User
    ├── neighborhoodId: ObjectId -> Neighborhood (optional)
    └── countryId: ObjectId -> Country (optional)

City (ObjectId)
├── Borough (many)
│   └── cityId: ObjectId -> City
└── Neighborhood (many - direct city neighborhoods)
    └── cityId: ObjectId -> City

Borough (ObjectId)
├── cityId: ObjectId -> City
└── Neighborhood (many)
    └── boroughId: ObjectId -> Borough

Map (ObjectId)
├── cityIds: [ObjectId] -> City
└── boroughIds: [ObjectId] -> Borough

Country (ObjectId)
└── Visit (many)
    └── countryId: ObjectId -> Country
```

### 6. **Index Updates Required**

After fixing references, update indexes:

```javascript
// Visit model indexes:
visitSchema.index({ userId: 1, neighborhoodId: 1 }, { unique: true, sparse: true });
visitSchema.index({ userId: 1, countryId: 1 }, { unique: true, sparse: true });

// Neighborhood model indexes:
neighborhoodSchema.index({ boroughId: 1 });
neighborhoodSchema.index({ cityId: 1 });
```

## Migration Strategy

1. **Create migration script** to convert existing String IDs to ObjectIds
2. **Update all model files** with proper ObjectId references
3. **Update all methods** to remove `.toString()` calls
4. **Test all relationships** with populate() calls
5. **Update API endpoints** to handle ObjectId validation

This will create a properly normalized database with consistent relationships across all models.