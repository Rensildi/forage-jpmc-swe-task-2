import React, { Component } from 'react';
import { Table } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import './Graph.css';

/**
 * Props declaration for <Graph />
 */
interface IProps {
  data: ServerRespond[],
}

/**
 * Perspective library adds load to HTMLElement prototype.
 * This interface acts as a wrapper for Typescript compiler.
 */
// Enabling 'PerspectiveViewerElement' to behave like an HTMLElement.
// Using 'extends HTMLELEMENT'
interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void,
}

/**
 * React component that renders Perspective based on data
 * parsed from its parent through data property.
 */
class Graph extends Component<IProps, {}> {
  // Perspective table
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element to attach the table from the DOM.
    // Simplifying the 'const elem' defenition by assigning it directly to the result of 'document.getElementsByTagName'. since I already extended  'PerspectiveViewerElement' to the 'HTMLELEMENT'
    const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    const schema = {
      stock: 'string',
      top_ask_price: 'float',
      top_bid_price: 'float',
      timestamp: 'date',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.

      // Add more Perspective configurations here.
      // Adding view column-pivots, row-pivots, columns, and aggregates
      elem.load(this.table);
      // 'view' is the kind of graph visalizing the data with.
      // Initialy it was using grid type, however since the task is asking for a graph I am using y_line
      elem.setAttribute('view', 'y_line');
      // 'column-pivots' is what will allow us to distinguish stock ABC from DEF.
      elem.setAttribute('column-pivots', '["stock"]');
      // 'row-pivots' takes care of x-axis. It allows to map each datapoint based on its timestamp. Without this, x-axis would be blank.
      elem.setAttribute('row-pivots', '["timestamp"]');
      // 'columns' allows to focus on a particular part of a stock's data along the y-axis.
      // Without the column the graph would plot different data points of a stock.
      elem.setAttribute('columns', '["top_ask_price"]');
      // 'aggregates' allows to handle the duplicated data from the old version of the code.
      // It is only needed to be considered a data point unique if it has a unique stock name and timestamp.
      // If there are duplicates like the old version, we will need to average out the top_bid_prices and the top_ask_pprices of the similar data points before treating them as one.
      elem.setAttribute('aggregates', '{"stock":"distinct count","top_ask_price":"avg","top_bid_price":"avg","timestamp":"distinct count"}');
    }
  }

  componentDidUpdate() {
    // Everytime the data props is updated, insert the data into Perspective table
    if (this.table) {
      // As part of the task, you need to fix the way we update the data props to
      // avoid inserting duplicated entries into Perspective table again.
      this.table.update(this.props.data.map((el: any) => {
        // Format the data from ServerRespond to the schema
        return {
          stock: el.stock,
          top_ask_price: el.top_ask && el.top_ask.price || 0,
          top_bid_price: el.top_bid && el.top_bid.price || 0,
          timestamp: el.timestamp,
        };
      }));
    }
  }
}

export default Graph;
