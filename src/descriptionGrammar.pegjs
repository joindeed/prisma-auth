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

RoleName = ValidIdentifier

RoleArguments = "(" args:(ArgumentWithValue*) ")" {
  	return args.reduce((acc: any, curr: any) => {
      acc[curr.name] = curr.value
      return acc
    }, {})
  }

ArgumentWithValue = _ name:ArgumentName ":" _ value:ArgumentValue _ ","? _ {return {name, value}}

ArgumentName = ValidIdentifier

ArgumentValue = Array / ValidIdentifier

Array = "[" values:ArrayMember* "]" {return values}

ArrayMember = _ value:ValidIdentifier _ ","? {return value}

ValidIdentifier = value:[A-Za-z0-9-]+ { return value.join('') }

_ "whitespace"
  = [ \t\n\r]* {return null}
