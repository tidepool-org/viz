# Suspends

Part of the [Device Events Domain](./index.md).

Suspends track when insulin delivery is paused.

---

## Status Event Structure

```javascript
{
  type: "deviceEvent",
  subType: "status",
  status: "suspended",            // or "resumed"
  duration: 300000,               // 5 minutes (ms)
  reason: {
    suspended: "manual",          // see reasons below
  },
  time: "2024-01-15T14:30:00Z",
}
```

---

## Suspend Reasons

| Reason | Description | Source |
|--------|-------------|--------|
| `manual` | User-initiated suspend | User action |
| `automatic` | Algorithm-initiated (predictive low) | Closed-loop system |
| `low_glucose` | Low glucose suspend (LGS) | Safety feature |

---

## Screenshots

### Single Automated Suspend

![Single automated suspend](./screenshots/single%20automated%20suspend.png)

### Multiple Automated Suspends

![Multiple automated suspends](./screenshots/multiple%20automated%20suspends.png)

---

## Counting Distinct Suspends

Consecutive suspend records (same `normalEnd` to `normalTime`) are counted as one distinct suspend event:

```javascript
// src/utils/basal.js
export const countDistinctSuspends = (data) => {
  const suspends = _.filter(data.data, d => d.deliveryType === 'suspend');
  
  const result = { prev: {}, distinct: 0 };
  _.reduce(suspends, (acc, datum) => {
    // Only count non-contiguous suspends as distinct
    if (_.get(acc.prev, 'normalEnd') === datum.normalTime) {
      // Skip - contiguous with previous
    } else {
      acc.distinct++;
    }
    acc.prev = datum;
    return acc;
  }, result);
  
  return result.distinct;
};
```

---

## Relationship to Basal Data

Suspend events correlate with basal records where `deliveryType: "suspend"` and `rate: 0`:

```javascript
// Basal suspend record
{
  type: "basal",
  deliveryType: "suspend",
  rate: 0,
  suppressed: {
    deliveryType: "scheduled",  // or "automated"
    rate: 0.85,                 // rate that would have been delivered
  },
}
```

See [Basal: Suspends](../insulin/basal/index.md#suspend) for visual rendering.

---

## Key Source Files

| Purpose | File |
|---------|------|
| Suspend component | `src/components/common/data/Suspend.js` |
| Suspend counting | `src/utils/basal.js` |
| Data processing | `src/utils/DataUtil.js` |

---

## See Also

- [Device Events Overview](./index.md)
- [Basal Subdomain](../insulin/basal/index.md) - Suspend basal delivery
- [Alarms](./alarms.md) - Related delivery interruptions
