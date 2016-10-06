## Web Worker data preprocessing

The input data to the visualizations produced by code in this repository is raw data adhering to the [Tidepool data model](http://developer.tidepool.io/data-model/ 'Tidepool Developer Microsite: Data Model Documentation')(s) for diabetes data. For some visualization tasks, we need to do a little additional processing on the front end in order to work with this data. For example, UTC `time`s need to be localized according to the user's display timezone for some visualization tasks. In many cases it makes the most sense (in terms of visualization performance) to ensure that we are only doing these tasks *once* as the data is provided to the application from the back end. In order to preserve all UI interactions while this preprocessing is happening, we do the preprocessing in a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API 'MDN: Web Worker APIs').

The data preprocessing steps are, in brief:

  1. [blip] after data comes in from the back end, blip passes the data to the `workerProcessPatientData` "thunk" (see function of this name in `src/redux/actions/worker.js`)
  1. [`workerProcessPatientData` thunk] filter out the datatypes that aren't yet being visualized (e.g., the `alarm` sub-type of `deviceEvent`, `cgmSettings`)
  1. [`workerProcessPatientData` thunk] sort by (UTC) `time`
  1. [`workerProcessPatientData` thunk] split into two chunks to be processed: (1) most recent 30 days and (2) the remainder; pass these chunks to the Web Worker by dispatching a redux action of type `WORKER_PROCESS_DATA_REQUEST` for each chunk of data (again, see `src/redux/actions/worker.js` in this repository)
  1. [`DiabetesDataWorker`] [not yet implemented] filter out data that's not a candidate for visualization based on schemas for each datatype defining fields & values necessary for visualization; this filters out:
     + old data or "bad" data uploaded through a 3rd party application that doesn't match the Tidepool data model
     + valid data that nevertheless is not a candidate for visualization, e.g., a `basal` with a `duration` of 0 (would be zero width and therefore invisible)
  1. [`DiabetesDataWorker`] add fields that are "expensive" (relatively speaking) to calculate so that we only have to do this once
     + parsing ISO 8601 formatted String timestamps into hammertimes (i.e., Unix timestamp with millisecond resolution)
     + adding `date`, `dayOfWeek`, and `msPer24` with localization to user's display timezone
  1. [`DiabetesDataWorker`] remove the fields from each datum that do *not* (and thus *should not*) be used in the visualization code, including all of the offsets (`timezoneOffset`, etc.), `guid`, `deviceTime`, etc.
  1. cache the preprocessed data inside a set of [crossfilter](http://square.github.io/crossfilter/ 'Crossfilter') objects for each datatype; visualizations then request the data needed for visualization (based on date range, etc.) by dispatching a `WORKER_FILTER_DATA_REQUEST`

We do all this preprocessing on new clones of each datum, *not* by mutating each.

The roles of the files & folders in this directory are as follows:

- `datatypes.js` just exports the array of datatypes that we are currently visualizing with code in this repository; used for 2. above.
- `DiabetesDataWorker.js` is a class that provides a single `handleMessage` instance method for use as the Web Worker's `onmessage` handler. (This class was factored out for ease of test instrumentation since the Web Worker `postMessage` global is not available in our test environment.)
- `index.js` just creates an instance of the `DiabetesDataWorker` and calls the worker's `handleMessage` for each incoming message, passing it the message as well as the Web Worker `postMessage` method.
- `mungers.js` contains the functions for performing the various calculations needed in the preprocessing, factored out for easy test instrumentation.
- `transformers.js` exports the single `cloneAndTransform` function that calls all the required `mungers` used in the preprocessing; again, it was necessary to separate out this function into its own module in order to stub out the `mungers` in tests (thus keeping the tests simple, with minimal fixtures).

