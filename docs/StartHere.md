# @tidepool/viz developer guide

This repository, which is published to [npm](https://www.npmjs.com/ 'node package manager') as [@tidepool/viz](https://www.npmjs.com/package/@tidepool/viz 'npm: @tidepool/viz') is a library providing data visualization components and state management tools for use in [blip](https://github.com/tidepool-org/blip 'GitHub: blip'), Tidepool's main web application for people with type 1 diabetes and their care teams to view and contextualize (via notes) the PwD's diabetes device data.

You can view (some of) the components in this library via two Storybooks published as static sites:

1. [components rendering data types in the Tidepool data model](http://developer.tidepool.io/viz/diabetes-data-stories/ 'Storybook for Tidepool diabetes data model renderers')
1. [all other components](http://developer.tidepool.io/viz/stories/ 'Storybook for all non-diabetes data @tidepool/viz components')

## Quick Links

**New to the codebase? Start here:**
- [Getting Started](./GettingStarted.md) - Setup, development workflows, and key concepts

**Understanding the system:**
- [Architecture](./Architecture.md) - Design decisions and system overview
- [Feature Overview](./FeatureOverview.md) - Overview of data visualization views

**Reference:**
- [Code Style](./CodeStyle.md) - Coding conventions
- [Directory Structure](./DirectoryStructure.md) - Code organization
- [Storybook Guide](./Storybook.md) - Working with component stories

**Core utilities (see JSDoc in source):**
- `src/utils/DataUtil.js` - Central data management
- `src/utils/StatUtil.js` - Statistical calculations

The root-level [README](../README.md) contains the nuts & bolts of installing, configuring, and commands to accomplish various tasks.

The [per-view documentation](./views/README.md) is the place to look for details on the implementation of each major data "view" implemented in this repository for inclusion in blip.

Additional topics:

- [Common props](./misc/CommonProps.md) - Reference for common props used across viz components
- [Working on docs](./misc/Docs.md) - Guidance on contributing to documentation
- [Time rendering modes](./misc/TimeRenderingModes.md) - Timezone-aware vs timezone-naïve rendering
