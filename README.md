# SunTree

Custom designed Family Tree in the form of the Sun. Feel free to fork it and create your own tree. See here for steps http://family--tree.org/

## About

This is the source code for a family tree renderer. The design inspiration came from [MyHeritage](https://blog.myheritage.com/2016/06/new-innovation-sun-charts/). There were several other requirements which weren't cover by MyHeritage's team so we developed this renderer. 

The tree output is a SVG file which works fine on the most high-end devices. The original version was producing Canvas but it wasn't working on mobile without some magic so it was easier to switch to SVG.

## Features

- Sun layout tree
- Web-based application
- Print version
- Multi-language support
- Layout customizations for both web-based and print version
- "Debug" controls for live customizations
- Easy-to-create input files

## Sun Layout Tree

As you might already read, the tree is in the shape of the sun.

- It starts from the first known ancestor in the center
- On the background of the ancestor is a map which represents the region from where was the ancestor
- Male, female, child, deceased are in different colors
- In addition to a name, the birth date and death date is displayed
- The tree supports several wives

The user interaction inspiration of the tree was from Google Maps. A user should use a scroll to zoom in/out and drag & drop to move around. 

## Web-based Application

The main idea of the renderer was to host it on your web-site so that everyone can access it anytime. 

The design consists of:

- Title & Subtitle
- Language selector and tutorial
- The tree itself
- Meta information and the legend

Everything can be changed for each language. See below in "Input files" for more information.

If you forked the repository, the app works perfectly fine with [GitHub Pages](https://pages.github.com/). Once you opened the URL of a GitHub Page, it will retrieve `/index.html` and display the app.

## Print Version

The print version was designed for the cases when one wants to print a fancy family tree for the dining hall. To retreive it, simply add `/print` to your URL.

- It has a huge Title and Subtitle
- The meta information on the left
- The legend on the right

To print or save, use a browser print feature (cmd+P or ctrl+P). You will be able to select the size (up to A0) and save as a PDF to print it later.

The language selector and the controls won't be displayed.

## Multi-language Support

Both web-based and print versions have a language selector which translates all meta information as well as the entire tree (even the map).

It's easy to add any new languages in [config.json](https://github.com/aslushnikov/ftree/blob/master/src/assets/configs.json)

## Customizations

Each version has both common settings and its own settings for the layout and styles.

### Layout

In [index.js](https://github.com/aslushnikov/ftree/blob/master/src/index.js) the following default settings are presented:

- `setPersonRadius` is the radius (pixels) of each circle for every person
- `setSize` is global setting representing the size of everything in the tree: circles, the distance between generations, names, the map
- `setOverlap` is the distance between each person
- `setInitialRotation` allows to rotate the tree clockwise and counterclockwise
- `setLevelSizeOffset` is the distance between the first ancestor and the second generation

For live updates of those settings, use `Debug controls` (see below).

Simillary to `index.js`, the [print.js](https://github.com/aslushnikov/ftree/blob/master/src/print.js) has the same settings for the print version. 

### Styles

Use [svg_renderer.css](https://github.com/aslushnikov/ftree/blob/master/src/svg_renderer.css) to update the following styles of the tree:
- Colors of the circles
- Font and font sizes for names, dates and for root ancestor

Use [style.css](https://github.com/aslushnikov/ftree/blob/master/src/style.css) to update overall styles of the web app.

Use [print.css](https://github.com/aslushnikov/ftree/blob/master/src/print.css) to update overall styles of the print version. 

Both `style.css` and `print.css` overwrite `svg_renderer.css`. So for example if you want to make a bigger font size for names in print version, you just add `.person .name` class to `print.css`. That way the web-based app will remain the same.

## Debug Controls

To make easier the tree layout customization, the "Debug controls" were introduced. It allows updating the default settings of either `index.js` or `print.js` right on the web page. Simply add `/#debug` to both web-based app or print version.

## Input Files

There are several files required to render the tree and the web pages. All files are located in [assets folder](https://github.com/aslushnikov/ftree/tree/master/src/assets).

### Meta Information

[configs.json](https://github.com/aslushnikov/ftree/blob/master/src/assets/configs.json) stores the settings for each language: displayed name, the link to tree data, to the legend and meta information data, to the background image.

An example of a legend & meta information data consists of:
- Names in the legend
- `Title`, `Subtitle`, `tutorial`, `birth_abbreviation`, `death_abbreviation`, `text_columns` for web-based version and `print_columns` for print version

### Tree Data

The renderer expects a CSV file for each language. There are 2 options how to create it.

#### FamilyEcho

The best way to create the tree data is to use [FamilyEcho](https://familyecho.com) web-service. Creation of the tree might require quite a long time, so we suggest to create an account there.

Once the tree is ready, tap "Download / export this family.." and select CSV format. Add it to `/assets` and update the link in `configs.json`. Done!

To translate to other languages, simply open the CSV file in Excel / Google Sheets and use "Find and Replace".

#### Manually

The other option is to manually create the CSV file. The following columns must be presented: ID, firstName, lastName, genderDescriptor, birthYear, deathYear, MotherID, FatherID, PartnerID. 

By default, the renderer expects the columns' order in the same order as in `FamilyEcho` export. To change it, edit in [tree_loader.js](https://github.com/aslushnikov/ftree/blob/master/src/tree_loader.js) starting from the line 38 and 104.

# Contact us

If you have any issues with the tree feel free to create an issue or directly reach out us. Pull requests are also very welcome. 

