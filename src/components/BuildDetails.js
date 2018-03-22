import PropTypes from 'prop-types';
import React from 'react';
import {commitMutation, createFragmentContainer, graphql, requestSubscription,} from 'react-relay';
import {withRouter} from 'react-router-dom'
import Paper from 'material-ui/Paper';
import ReactMarkdown from 'react-markdown';

import TaskList from './TaskList';
import NotificationList from "./NotificationList";
import environment from "../createRelayEnvironment";
import BuildStatusChip from "./chips/BuildStatusChip";
import RepositoryNameChip from "./chips/RepositoryNameChip";
import {hasWritePermissions} from "../utils/permissions";
import {FontIcon, RaisedButton} from "material-ui";
import {cirrusColors} from "../cirrusTheme";

const buildApproveMutation = graphql`
  mutation BuildDetailsApproveBuildMutation($input: BuildInput!) {
    approve(input: $input) {
      build {
        id
        status
      }
    }
  }
`;

const buildReTriggerMutation = graphql`
  mutation BuildDetailsReTriggerMutation($input: BuildReTriggerInput!) {
    retrigger(input: $input) {
      build {
        id
        status
      }
    }
  }
`;

const buildSubscription = graphql`
  subscription BuildDetailsSubscription(
    $buildID: ID!
  ) {
    build(id: $buildID) {      
      id
      durationInSeconds
      status
      notifications {
        level
        message
      }
    }
  }
`;

class BuildDetails extends React.Component {
  static contextTypes = {
    router: PropTypes.object,
  };

  componentDidMount() {
    let variables = {buildID: this.props.build.id};

    this.subscription = requestSubscription(
      environment,
      {
        subscription: buildSubscription,
        variables: variables
      }
    );
  }

  componentWillUnmount() {
    this.closeSubscription();
  }

  closeSubscription() {
    this.subscription && this.subscription.dispose && this.subscription.dispose()
  }

  render() {
    let build = this.props.build;

    let styles = {
      main: {
        paddingTop: 8
      },
      gap: {
        paddingTop: 16
      },
      title: {
        padding: 0
      },
      repoButton: {
        padding: 0
      },
      repoButtonIcon: {
        fontSize: 48
      },
      chip: {
        marginTop: 4,
        marginBottom: 4,
        marginRight: 4,
      },
      wrapper: {
        paddingLeft: 0,
        display: 'flex',
        flexWrap: 'wrap',
      },
    };

    let repoUrl = build.repository.cloneUrl.slice(0, -4);
    let branchUrl = build.branch.startsWith("pull/") ? `${repoUrl}/${build.branch}` : `${repoUrl}/tree/${build.branch}`;
    let commitUrl = repoUrl + "/commit/" + build.changeIdInRepo;

    let notificationsComponent = !build.notifications ? null :
      <div style={styles.gap}>
        <NotificationList notifications={build.notifications}/>
      </div>;

    let canBeReTriggered = build.status === 'FAILED'
      && hasWritePermissions(build.repository.viewerPermission)
      && build.tasks && build.tasks.length === 0;
    let reTriggerButton = !canBeReTriggered ? null :
      <RaisedButton label="Re-Trigger"
                    backgroundColor={cirrusColors.success}
                    onTouchTap={() => this.reTriggerBuild(build.id)}
                    icon={<FontIcon className="material-icons">refresh</FontIcon>}
      />;


    let needsApproval = build.status === 'NEEDS_APPROVAL' && hasWritePermissions(build.repository.viewerPermission);
    let approveButton = !needsApproval ? null :
      <RaisedButton label="Approve"
                    backgroundColor={cirrusColors.success}
                    onTouchTap={() => this.approveBuild(build.id)}
                    icon={<FontIcon className="material-icons">check</FontIcon>}
      />;

    return (
      <div style={styles.main} className="container">
        <Paper zDepth={2} rounded={false}>
          <div className="card-block">
            <div style={styles.wrapper}>
              <RepositoryNameChip style={styles.chip} repository={build.repository}/>
              <BuildStatusChip style={styles.chip} build={build}/>
            </div>
            <div style={styles.gap}/>
            <h5 className="card-title align-middle">
              Commit <a href={commitUrl} target="_blank">{build.changeIdInRepo.substr(0, 6)}</a> on branch <a
              href={branchUrl} target="_blank">{build.branch}</a>:
            </h5>
            <ReactMarkdown className="card-text" source={build.changeMessage}/>
            <div className="card-body text-right">
              {reTriggerButton}
              {approveButton}
            </div>
          </div>
        </Paper>
        {notificationsComponent}
        <div style={styles.gap}/>
        <Paper zDepth={2} rounded={false}>
          <TaskList tasks={build.tasks}/>
        </Paper>
      </div>
    );
  }

  approveBuild(buildId) {
    const variables = {
      input: {
        clientMutationId: "approve-build-" + buildId,
        buildId: buildId,
      },
    };

    commitMutation(
      environment,
      {
        mutation: buildApproveMutation,
        variables: variables,
        onError: err => console.error(err),
      },
    );
  }

  reTriggerBuild(buildId) {
    const variables = {
      input: {
        clientMutationId: "re-trigger-build-" + buildId,
        buildId: buildId,
      },
    };

    commitMutation(
      environment,
      {
        mutation: buildReTriggerMutation,
        variables: variables,
        onError: err => console.error(err),
      },
    );
  }
}

export default createFragmentContainer(withRouter(BuildDetails), {
  build: graphql`
    fragment BuildDetails_build on Build {
      id
      branch
      changeIdInRepo
      changeTimestamp
      changeMessage
      durationInSeconds
      status
      notifications {
        level
        message
      }
      tasks {
        ...TaskListRow_task
      }
      repository {
        id
        owner
        name
        cloneUrl
        viewerPermission
      }
    }
  `,
});
