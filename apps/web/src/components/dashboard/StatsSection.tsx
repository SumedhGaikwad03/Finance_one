import StatCard from "./StatCard";

type StatSectionProps = {

    budget : string ;
    spent : string ;
    remaining :string ; 
    usage : string ;
};

const StatSection = ({

    budget , // all of these props are received from the parent via the call to this function 
    spent , 
    remaining , 
    usage ,
}: StatSectionProps) => { // the o/p of this function is an jsx element  in this structure 

    return (

        <section>

            <StatCard // here again this is child of stat section 
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

