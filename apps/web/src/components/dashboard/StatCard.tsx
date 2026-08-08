

type StatCardProps ={

    title : string ; 
    value : string ; 
    
};


const StatCard =({

    title , 
    value 
} : StatCardProps) => { // take this two propeties from statsCardprops as title , value 
 return (
    <div>
        <h3>
            {title} 
        </h3>

        <p>
            {value} 
        </p>
    </div>
 );
};

export default StatCard; 