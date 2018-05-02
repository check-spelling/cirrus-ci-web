import React from 'react';

import {graphql, QueryRenderer} from 'react-relay';

import environment from '../../createRelayEnvironment';
import ViewerBuildList from '../../components/ViewerBuildList'
import CirrusLinearProgress from "../../components/CirrusLinearProgress";
import {FormGroup, Paper, Toolbar, Typography} from "material-ui";

const Home = (props) => (
  <QueryRenderer
    environment={environment}
    query={
      graphql`
        query HomeViewerQuery {
          viewer {
            ...ViewerBuildList_viewer
          }
        }
      `
    }

    render={({error, props}) => {
      if (!props) {
        return <CirrusLinearProgress/>
      }
      if (!props.viewer) {
        return (
          <Paper elevation={1}>
            <Toolbar>
              <FormGroup>
                <Typography variant="title">Please Log In to see your recent builds</Typography>
              </FormGroup>
            </Toolbar>
          </Paper>
        );
      }
      return <ViewerBuildList viewer={props.viewer}/>
    }}
  />
);

export default Home;
