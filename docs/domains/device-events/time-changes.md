# Time Changes

Part of the [Device Events Domain](./index.md).

Device clock adjustments, used for timezone detection and data integrity.

---

## Time Change Event Structure

```javascript
{
  type: "deviceEvent",
  subType: "timeChange",
  change: {
    from: "2024-01-15T14:30:00",
    to: "2024-01-15T15:30:00",
    agent: "manual",              // or "automatic"
  },
  time: "2024-01-15T15:30:00Z",
}
```

---

## Change Agents

| Agent | Description |
|-------|-------------|
| `manual` | User manually adjusted device time |
| `automatic` | Device auto-synced time (e.g., from phone) |

---

## Use Cases

### Timezone Detection

Time changes help `DataUtil` recommend appropriate timezone settings for data display:

```javascript
// When device time jumps forward/back by hours, 
// it may indicate timezone change during travel
if (hoursDifference === 1 || hoursDifference === -1) {
  // Likely DST change
} else if (Math.abs(hoursDifference) > 1) {
  // Likely timezone change from travel
}
```

### Data Integrity

Time change events help identify:
- Clock drift corrections
- Daylight Saving Time adjustments
- Travel across time zones
- Manual time corrections after battery replacement

---

## Key Source Files

| Purpose | File |
|---------|------|
| Data processing | `src/utils/DataUtil.js` |
| Timezone utilities | `src/utils/datetime.js` |

---

## See Also

- [Device Events Overview](./index.md)
- [Time Rendering](../../reference/time-rendering.md) - How times are displayed
