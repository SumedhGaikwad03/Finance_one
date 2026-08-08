import StatCard from "./StatCard";

type StatSectionProps = {

    budget : string ;
    spent : string ;
    remaining :string ; 
    usage : string ;
};

const StatSection = ({

    budget , 
    spent , 
    remaining , 
    usage ,
}: StatSectionProps) => {

    return (

        <section>

            <StatCard
                title="Total Budget"
                value={budget}
            />

            <StatCard
                title="Total Spent"
                value={spent}
            />

            <StatCard
                title="Remaining Budget"
                value={remaining}
            />

            <StatCard
                title="Budget Usage"
                value={usage}
            />

        </section>

    );
};

export default StatSection ; 

