# Site Changes

Part of the [Device Events Domain](./index.md).

Site changes are inferred from prime and reservoir change events.

---

## Prime Events

```javascript
{
  type: "deviceEvent",
  subType: "prime",
  primeTarget: "tubing",          // or "cannula"
  volume: 15.0,                   // units primed
  time: "2024-01-15T14:30:00Z",
}
```

### Prime Targets

| Target | Description |
|--------|-------------|
| `tubing` | Infusion line filled with insulin |
| `cannula` | Insertion site filled |

---

## Reservoir Change

```javascript
{
  type: "deviceEvent",
  subType: "reservoirChange",
  time: "2024-01-15T14:30:00Z",
}
```

---

## Manufacturer Terminology

Different pump manufacturers use different terms for the same actions:

| Action | Tandem | Insulet (OmniPod) | Medtronic | Animas |
|--------|--------|-------------------|-----------|--------|
| **Reservoir** | Cartridge Change | Pod Change | Rewind | Go Rewind |
| **Tubing** | Tubing Fill | Pod Activate | Prime | Go Prime |
| **Cannula** | Cannula Fill | Prime | Cannula Prime | Cannula Fill |

The `getPumpVocabulary()` function in `src/utils/device.js` returns the appropriate terminology for each manufacturer.

---

## Site Change Images

The visualization uses device-specific icons located in `static-assets/images/`:

| Image | File | Description |
|-------|------|-------------|
| Reservoir | `sitechange-reservoir.png` | Reservoir/cartridge change |
| Tubing | `sitechange-tubing.png` | Tubing prime |
| Cannula | `sitechange-cannula.png` | Cannula prime |
| Loop Tubing | `sitechange-loop-tubing.png` | Loop-specific tubing |
| Twiist Cassette | `sitechange-twiist-cassette.png` | Twiist cassette change |

---

## Site Change Detection

Site changes are detected by looking for prime and reservoir change events that occur close together in time:

```javascript
// Typical site change sequence:
1. reservoirChange  // New cartridge/pod
2. prime (tubing)   // Fill tubing
3. prime (cannula)  // Fill cannula
```

---

## Key Source Files

| Purpose | File |
|---------|------|
| Pump vocabulary | `src/utils/device.js` |
| Site change images | `static-assets/images/sitechange-*.png` |
| Data processing | `src/utils/DataUtil.js` |

---

## See Also

- [Device Events Overview](./index.md)
- [Alarms](./alarms.md) - Related pump events
