// Props required for the dashboard header.
type DashboardHeaderProps = {

    username: string;

};

// Displays the heading and welcome message.
const DashboardHeader = ({

    username,

}: DashboardHeaderProps) => {

    return (

        <header>

            <h1>

                Finance One Dashboard

            </h1>

            <p>

                Welcome back, {username}

            </p>

        </header>

    );

};

export default DashboardHeader;