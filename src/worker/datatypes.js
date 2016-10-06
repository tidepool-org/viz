/*
 * == BSD2 LICENSE ==
 * Copyright (c) 2016, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 * == BSD2 LICENSE ==
 */

/*
 * This module exports the types that should be preprocessed with the Web Worker.
 *
 * We want to limit this to data types that we are *actually* visualizing with
 * the processed data since we sometimes determine domain of display based on
 * available data, with weird results when the data includes alarms that aren't
 * visualized with timestamps in 2007 (to name an egregious example).
 *
 * As we add new visualizations and port tideline visualizations into viz,
 * we will expand this list of types accordingly.
 */

export const types = [
  'cbg',
  'smbg',
];
