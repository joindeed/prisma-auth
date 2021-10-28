Expression
  = _ "@Auth(" value:OperationWithRoles* ")" _ .* {
  	return value.reduce((acc: any, curr: any) => {
      acc[curr.name] = curr.roles
      return acc
    }, {})
  }
  
OperationWithRoles
  = _ name:OperationName ":" _ roles:RoleArray  _ ","? { return {name, roles}}
  
OperationName
  = ("read" / "create" / "update" / "delete")
  
RoleArray = "[" roles:Role* "]" { return roles }

Role = _ name:RoleName args:RoleArguments? _ ","? _ { return {name,args} }

RoleName = KeyIdentifier

RoleArguments = "(" args:(ArgumentWithValue*) ")" {
  	return args.reduce((acc: any, curr: any) => {
      acc[curr.name] = curr.value
      return acc
    }, {})
  }

ArgumentWithValue = _ name:ArgumentName ":" _ value:ArgumentValue _ ","? _ {return {name, value}}

ArgumentName = KeyIdentifier

ArgumentValue = Array / ValueIdentifier

Array = "[" values:ArrayMember* "]" {return values}

ArrayMember = _ value:ValueIdentifier _ ","? {return value}

KeyIdentifier = value:[A-Za-z0-9]+ { return value.join('') }
ValueIdentifier = value:[A-Za-z0-9-:]+ { return value.join('') }


_ "whitespace"
  = [ \t\n\r]* {return null}
